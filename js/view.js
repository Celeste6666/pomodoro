import controller from './controller.js';
export default {
  task: document.querySelector('.task'),
  timer: document.querySelector('.timer'),
  pomodoroList: document.querySelector('.pomodoro_list'),
  timePlay: document.querySelector('.timer_clock-play'),
  renderTask(id, data) {
    let str = `<tr class="${data.status === 'done'?'text-secondary':''}" data-id=${id}>
                  <td class="fs-5">
                    <i class="bi ${data.icon}" data-id=${id}></i>
                    <button class="btn fs-6 ${data.status === 'done'?'text-decoration-line-through':''}" data-id=${id} data-status=${data.status} data-taskname=${data.taskName}>${data.taskName}</button>
                  </td>
                  <td class="fs-5 text-end">
                    <i class="bi bi-pencil p-2" data-id=${id}
                    data-status=${data.status}
                    data-bs-toggle="modal"
                    data-bs-target="#addNewTask"></i>
                    <i class="bi bi-trash p-2" data-id=${id}></i>
                  </td>
                </tr>`
    if (data.status === 'todo' || data.status === 'process') {
      document.querySelector('#todo').insertAdjacentHTML('afterbegin', str)
    } else if (data.status === 'done') {
      document.querySelector('#done').insertAdjacentHTML('afterbegin', str)
    }
  },
  renderTimer(id, data, workOrRest = 'workingTimeUnit') {
    let iconStr = ''
    let titleStr = `<h3 class="pb-2 border-bottom border-2 text-center timer_title_status">工作結束</h3>
          <h5 class = "pt-2 text-center timer_title_taskname">沒有工作囉！</h5>`
    if (id) {
      iconStr = `
              <i class="bi bi-trash p-2" data-id=${id}></i>
              <i class="bi bi-arrow-repeat p-2 my-3" data-id=${id}></i>
              <i class="bi bi-check2 p-2" data-id=${id}></i>`
      titleStr = `<h3 class="pb-2 border-bottom border-2 text-center timer_title_status">${workOrRest==='workingTimeUnit'?'工作中···':'休息中···'}</h3>
                <h5 class="pt-2 text-center timer_title_taskname">${data.taskName}</h5>`
    }
    document.querySelector('.timer-icons').innerHTML = iconStr;
    document.querySelector('.timer_title').innerHTML = titleStr;
  },
  renderTimeClock(timeStr) {
    document.querySelector('.timer_clock_countdown').innerHTML = timeStr
  },
  removeStopIcon() {
    document.querySelector('.bi-play-circle-fill').classList.remove('bi-stop-circle-fill');
    document.querySelector('body').classList.remove('start');
    [...document.querySelectorAll('.timer_clock-particle')].forEach(dom => {
      dom.remove()
    })
  },
  renderModal(item) {
    document.querySelector('.modal-title').textContent = item.id ? '編輯任務' : '新增任務';
    document.querySelector('#modal_taskname').value = item.data.taskName;
    document.querySelector('#modal_tasktype').value = item.data.type;
    document.querySelector('#modal_tasktime').value = item.data.restingDroplet;
    document.querySelector('.save').setAttribute('data-id', item.id)
  },
  removeTr(id) {
    document.querySelector(`tr[data-id="${id}"]`).remove()
  },
  render() {
    this.pomodoroList.addEventListener('click', function (e) {
      if (e.target.matches('.bi-trash')) {
        controller.removeData(e.target.dataset.id)
      } else if (e.target.dataset.taskname) {
        controller.setTimer(e.target.dataset.id, e.target.dataset.status)
      } else if (e.target.matches('.save')) {
        if (document.querySelector('#modal_taskname').value !== '') {
          let id = e.target.dataset.id
          let data = {
            taskName: document.querySelector('#modal_taskname').value,
            type: document.querySelector('#modal_tasktype').value,
            restingDroplet: document.querySelector('#modal_tasktime').value,
            workingDroplet: document.querySelector('#modal_tasktime').value
          };
          controller.saveTaskChange(id, data)
        }
      } else if (e.target.matches('.bi-arrow-repeat')) {
        controller.startTask('restart','');
      } else if (e.target.matches('.bi-check2') && e.target.dataset.id) {
        let id = e.target.dataset.id
        controller.setTimer(id, 'done')
      }
    })

    this.task.addEventListener('show.bs.collapse', function (e) {
      // dom.matches('cssSelector')
      if (e.target.matches('#todo')) {
        document.querySelector('.todo-icon').classList.remove('icon-rotate')
      } else if (e.target.matches('#done')) {
        document.querySelector('.done-icon').classList.remove('icon-rotate')
      }
    })

    this.task.addEventListener('hide.bs.collapse', function (e) {
      if (e.target.matches('#todo')) {
        document.querySelector('.todo-icon').classList.add('icon-rotate')
      } else if (e.target.matches('#done')) {
        document.querySelector('.done-icon').classList.add('icon-rotate')
      }
    })

    this.task.addEventListener('show.bs.modal', function (e) {
      controller.editData(e.relatedTarget.dataset.id, e.relatedTarget.dataset.status)
    })

    this.timePlay.addEventListener('click', function (e) {
      if (e.target.classList.contains('bi-play-circle-fill')) {
        document.querySelector('body').classList.toggle('start')
        e.target.classList.toggle('bi-stop-circle-fill')
        if (e.target.classList.contains('bi-stop-circle-fill')) {
          for (let i = 1; i <= 40; i++) {
            let maxRandomDroplet = Math.ceil(Math.random() * 40)
            let left = Math.ceil(Math.random() * (document.querySelector('.start .timer_clock-circle').clientWidth - maxRandomDroplet))
            let top = Math.ceil(Math.random() * (document.querySelector('.start .timer_clock-circle').clientHeight - maxRandomDroplet))
            let particleStr = `
              <div class="timer_clock-particle"
              style="width: ${maxRandomDroplet}px;
              height: ${maxRandomDroplet}px;
              top: ${top}px;
              left: ${left}px;
              animation-duration:${Math.ceil(Math.random()*i*5)}s;
              animation-delay:${Math.ceil(Math.random()*i)}s;
              "></div>`
            document.querySelector('.timer_clock-circle').insertAdjacentHTML('afterbegin', particleStr)
          }
          controller.startTask()
        } else {
          controller.startTask('', 'stop');
        }
      }
    })
  }
}