---
tags:
  - 오토에버
---
# 리액트 소개
# ES6와 타입스크립트 기초
## ES6
### Promise
promise 는 비동기 처리 
Promise 객체 생성되자마자 실행됨.
```javascript
const promise = new Promise((resolve, reject) => {
  resolve(1); // 초기 값 설정
});

promise
  .then((value) => {
    console.log(value); // 출력: 1
    return value + 1; // 다음 then으로 전달
  })
  .then((value) => {
    console.log(value); // 출력: 2
    return value + 1; // 다음 then으로 전달
  })
  .then((value) => {
    console.log(value); // 출력: 3
  });

```

Promise 객체에 변수를 던지는 방법

```javascript
const fetchData = (url) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(`Data from ${url}`), 1000);
  });
};

fetchData("https://api.example.com")
  .then((data) => {
    console.log(data); // 출력: Data from https://api.example.com
    return fetchData("https://api.example.com/next");
  })
  .then((data) => {
    console.log(data); // 출력: Data from https://api.example.com/next
    return fetchData("https://api.example.com/final");
  })
  .then((data) => {
    console.log(data); // 출력: Data from https://api.example.com/final
  });

```

### Class
class 선언과 consntructor
```javascript
class SomeClass {
	constructor(param1, param2) {
		this.param1 = param1
		this.param2 = param2
	}
}
```
## typescript
ES6 와 typescript 는 다른거니까
tsc 로 트렌스 파일 하여 ES6 를 타겟으로 컴파일, ==ES6 의 슈퍼셋==
### 타입 별칭
```typescript
type age = int
```
별칭을 부여 하는 것이므로 일동의 alias 명령과 같이 속성을 assign 한다.
따라서 class 형태의 타입 앨리어스도 `equal sign` 을 해야 한 것
```typescript
type person = {
	age : number;
	name : string;
}
```

