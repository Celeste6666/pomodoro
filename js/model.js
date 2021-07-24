import firebaseConfig from './firebaseConfig.js'
export default {
  firebaseConfig,
  db: '',
  todo: [],
  process: {},
  done: [],
  timeUnit: {
    workingTimeUnit: 25,
    restingTimeUnit: 5,
  },
  taskTimeUnit: 'workingTimeUnit',
  times:1,
  restTime: 0,
  taskDetail: {
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
}