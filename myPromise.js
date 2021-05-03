/**
 * 参照PromiseA+规范模拟ES6中Promise实现
 * 
 */

//promise的三种状态
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

//the Promise Resolution Procedure [[Resolve]](promise2, x).
const resolvePromise = (promise2, x, resolve, reject) => {
    //Promise A+ 2.3.1
    if (promise2 === x)
        return reject(new TypeError('Chaining cycle detected for promise #<Promise>'));
    let called;
    //Promise A+ 2.3.3
    if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
        try {
            //Promise A+ 2.3.3.1
            let then = x.then;
            if (typeof then === 'function') {
                then.call(x, y => {
                    if (called) return;
                    called = true;
                    resolvePromise(promise2, y, resolve, reject);
                }, r => {
                    if (called) return;
                    called = true;
                    reject(r);
                });
            } else {
                //2.3.3.4
                resolve(x)
            }
        } catch (error) {
            //2.3.3.3.4.1
            if (called) return;
            //Promise A+ 2.3.3.2 && 2.3.3.3.4.2
            called = true;
            reject(error);
        }
    } else {
        resolve(x);
    }
};

class Promise {
    constructor(executor) {
        //初始状态
        this.status = PENDING;
        //存放成功状态的值
        this.value = undefined;
        //存放失败状态的值
        this.reason = undefined;
        //存放成功回调
        //使用队列原因是要符合Promise A+规范2.2.6中then可以被同一个promise对象调用多次
        //如果用变量存储回调，则多个p.then()只会执行一次
        this.onResolvedCallback = [];
        //存放失败回调
        this.onRejectedCallback = [];

        //使用箭头函数固定this指向
        let resolve = (value) => {
            if (this.status !== PENDING) return;
            this.status = FULFILLED;
            this.value = value;
            //依次执行回调
            this.onResolvedCallback.forEach(fn => fn());
            //Promise A+ 2.2.4: 'onFulfilled or onRejected must not be called until the execution context stack contains only platform code.'
            //setTimeout(runResolve);
        };

        let reject = (reason) => {
            if (this.status !== PENDING) return;
            this.status = REJECTED;
            this.reason = reason;
            this.onRejectedCallback.forEach(fn => fn());
        };

        try {
            //executor同步执行
            executor(resolve, reject);
        } catch (error) {
            reject(error);
        }
    }

    then(onFulfilled, onRejected) {

        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v;
        onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err };

        let promise2 = new Promise((resolve, reject) => {
            if (this.status === FULFILLED) {
                setTimeout(() => {
                    try {
                        //x === undefined if there is no return statement in onFulfilled
                        let x = onFulfilled(this.value);
                        //Promise A+ 2.2.7.1
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                });
            }
            if (this.status === REJECTED) {
                setTimeout(() => {
                    try {
                        let x = onRejected(this.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                });
            }
            if (this.status === PENDING) {
                this.onResolvedCallback.push(() => {
                    setTimeout(() => {
                        try {
                            let x = onFulfilled(this.value);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (error) {
                            reject(error);
                        }
                    });
                });
                this.onRejectedCallback.push(() => {
                    setTimeout(() => {
                        try {
                            let x = onRejected(this.reason);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (error) {
                            reject(error);
                        }
                    });
                });

            }
        });
        return promise2;
    }

    catch(onRejected) {
        return this.then(null, onRejected);
    }

    finally(callback) {
        return this.then(value =>{
            return Promise.resolve(callback()).then(() => value);
        },reason => {
            return Promise.resolve(callback()).then(() => {throw reason});
        });
    }

    static resolve(value) {
        if (value instanceof Promise) return value;
        return new Promise(resolve => resolve(value));
    }

    static reject(reason) {
        return new Promise((_, reject) => reject(reason));
    }

    static all() {

    }

    static race() {

    }

}

Promise.defer = Promise.deferred = function () {
    let dfd = {};
    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    })
    return dfd;
}
module.exports = Promise


// new MyPromise((resolve, reject) => {
//     console.log('promise executor run');
//     //resolve(2);
//     reject('失败')
// }).then().then(res => {console.log(res)}, err =>{console.log(err)});

// const promise = new MyPromise((resolve, reject) => {
//     resolve(1);
//   }).then(() => {
//       return new MyPromise((resolve, reject)=>{
//         reject('dsdsd')
//       });
//   }).then((value) => console.log(value), err => console.log(err));

//   setTimeout(console.log, 0, promise)











