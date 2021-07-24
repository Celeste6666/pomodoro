import model from './model.js'
import view from './view.js'

export default {
  init() {
    // Initialize Firebase
    firebase.initializeApp(model.firebaseConfig);
    model.db = firebase.firestore();
    this.getData();
    view.render();
  },
  getData() {
    model.db.collection('pomodoro').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'removed') return
        if (change.type === 'added') {
          if (change.doc.data().status === 'todo') {
            model.todo = [...model.todo, {
              id: change.doc.id,
              data: change.doc.data()
            }]
          } else if (change.doc.data().status === 'process') {
            model.process = {
              id: change.doc.id,
              data: change.doc.data()
            }
          } else if (change.doc.data().status === 'done') {
            model.done = [...model.done, {
              id: change.doc.id,
              data: change.doc.data()
            }]
          }
        }
        view.renderTask(change.doc.id, change.doc.data())
        view.renderTimer(model.process.id, model.process.data)
        //新增或編輯完後 欲編輯的task資料暫存回歸預設值
        model.taskDetail = {
          id: '',
          data: {
            taskName: '',
            type: '',
            createdAt: new Date(),
            restingDroplet: 1,
            workingDroplet: 1,
            status: 'todo',
            icon: 'bi-droplet'
          }
        }
      })
    })
  },
  editData(id, status) {
    if (id) {
      if (status !== 'process') {
        //編輯
        let index = model[status].findIndex(item => item.id === id)
        model.taskDetail = model[status][index]
      } else {
        model.taskDetail = model.process
      }
    }
    //出現編輯畫面(帶入儲存資料)或新增
    view.renderModal(model.taskDetail)
  },
  saveTaskChange(id, data) {
    for (let key in data) {
      model.taskDetail.data[key] = data[key]
    }
    if (id) {
      //編輯
      view.removeTr(id)
      model.db.collection('pomodoro').doc(id).update(model.taskDetail.data)
    } else {
      //新增
      model.db.collection('pomodoro').add(model.taskDetail.data)
    }
  },
  removeData(id) {
    model.db.collection('pomodoro').doc(id).delete().then(() => {
      model.todo = model.todo.filter(todo => todo.id !== id)
      model.done = model.done.filter(done => done.id !== id)
      if (model.process.id === id) {
        model.process = {}
        view.renderTimer(model.process.id, model.process.data)
      }
      view.removeTr(id)
    })
  },
  setTimer(id, status) {
    if (status === 'done' && model.process.id === id) {
      //把 process 變成 done
      model.process.data.status = 'done'
      model.process.data.icon = 'bi-droplet-fill';
      this.saveTaskChange(model.process.id, model.process.data)
      model.done = [...model.done, model.process]
      model.process = {}
      view.renderTimer(model.process.id, model.process.data)
    } else if (status === 'todo') {
      if (model.process.data !== undefined && model.process.id !== id) {
        //原本的process回歸todo
        //舊 model.process
        model.process.data.status = 'todo';
        model.process.data.icon = 'bi-droplet';
        model.todo = [...model.todo, model.process]
        this.saveTaskChange(model.process.id, model.process.data)
      }

      //新 model.process
      model.process = model.todo.filter(todo => todo.id === id)[0]
      model.todo = model.todo.filter(todo => todo.id !== id)
      model.process.data.status = 'process';
      model.process.data.icon = 'bi-droplet-half';
      this.saveTaskChange(model.process.id, model.process.data)
    } else if (status === 'process') {
      //如果狀態原本就是process，則回歸todo
      model.process.data.status = 'todo';
      model.process.data.icon = 'bi-droplet';
      model.todo = [...model.todo.filter(todo => todo.id !== id), model.process]
      this.saveTaskChange(model.process.id, model.process.data)
      model.process = {}
    }
    view.renderTimer(model.process.id, model.process.data)
    model.taskTimeUnit = 'workingTimeUnit'
    model.times = 1
  },
  runTask(nextTimeUnit = '', restart = '', stop = '') {
    let transferTime
    if (!model.restTime || restart) {
      //start
      // 將分鐘轉換成毫秒，加上目前的毫秒數即得出執行完任務的時間
      transferTime = model.timeUnit[model.taskTimeUnit] * 60 * 1000 + Date.now();
      model.restTime = model.timeUnit[model.taskTimeUnit] * 60 * 1000
    } else {
      //按下暫停或restart後再按開始
      transferTime = model.restTime + Date.now();
    };
    const vm = this

    let taskInterval = setInterval(runTimer, 500)
    //清除所有定時器的方法
    //https://blog.csdn.net/ycx60rzvvbj/article/details/113256013
    if (stop) {
      for (let i = 0; i <= taskInterval; i++) {
        clearInterval(i)
      }
      view.removeStopIcon()
      return
    } else if (restart) {
      for (let i = 0; i <= taskInterval; i++) {
        clearInterval(i)
      }
      view.removeStopIcon()
      // 目前工作所需時間為restart顯示的時間
      this.calculateRestTime(model.restTime)
      return
    }

    function runTimer() {
      if (model.restTime <= 500) {
        // 剩餘時間小於1s就不再繼續 Interval
        model.restTime = 0
        model.taskTimeUnit = nextTimeUnit
        view.renderTimer(model.process.id, model.process.data, nextTimeUnit)
        for (let i = 0; i <= taskInterval; i++) {
          clearInterval(i)
        }
        model.times++;
        if (model.times > model.process.data.workingDroplet * 2){
          vm.setTimer(model.process.id, 'done')
        }
        view.removeStopIcon()
      } else {
        model.restTime = transferTime - Date.now()
        vm.calculateRestTime(model.restTime)
      }
    }
  },
  calculateRestTime(restTime) {
    let restMinute = Math.floor(restTime / (1000 * 60))
    let restSecond = Math.floor((restTime / 1000) % 60)
    let timeStr = `${restMinute < 10 ? `0${restMinute}`:restMinute}：${restSecond < 10 ? `0${restSecond}`:restSecond}`
    view.renderTimeClock(timeStr)
  },
  startTask(restart = '', stop = '') {
    if (model.times <= model.process.data.workingDroplet * 2) {
      if (model.taskTimeUnit === 'workingTimeUnit') {
        this.runTask('restingTimeUnit', restart, stop)
      } else if (model.taskTimeUnit === 'restingTimeUnit') {
        this.runTask('workingTimeUnit', restart, stop)
      }
    }else{
      model.times = 1
    }
  }
}