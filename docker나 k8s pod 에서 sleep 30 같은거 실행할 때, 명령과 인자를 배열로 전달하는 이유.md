선언형에서 busybox 같은 image 에 명령 구문을 개발 할 때
1. sh 사용 `["/bin/sh","-c","sleep 30"]`
2. 명령과 인자를 배열로 엮어서 `["sleep", "30"]`
3. command 와 args 구분
	1. command: "sleep"
	2. args: "30"

다음과 같이 작성한다.

이는 이미지가 기동되는 컨테이너 내에 `shell` 이 있을지 그리고 그것에 의존할지 말지에 따라 선택하는 것이다. 이미지 내에 `shell` 이 있다면 1번 방식을 사용해도 일단 가능은 하다. 이는 `sleep 30` 같은 간단한 명령보다 더 복잡한 긴 명령을 익숙하게 쓰고 싶을 때 사용할 수 있다.
예를 들어 `ps -ef | grep 'node' | awk {print $2} | xargs kill -9` 같은 명령 말이다.

그러나 보안 강화 등의 목적으로 image 가 distroless 이든, shell 을 더 이상 사용할 수 없는 상황을 가정하면 비추천의 방법이 될 수 있다. 

`ENTRYPOINT ["/venv/bin/python3", "run_gunicorn.py", "--workers=2","--limit-request-field_size=0","--worker-class=eventlet","--bind=0.0.0.0:80","wsgi:main()"]`

같은 복잡한 명령은 왜 쓰는걸가? 왜 배열이나 목록으로 해야 할까?

어떤 개발된 프로그램의 구현체의 main 프로그램은 대부분 아래와 같기 때문이다.

`main(args[])`

docker 나 k8s image runner 는 ==쉘의 도움 없이== 프로그램을 명확히 찾고 인자를 전달하는 방식으로 system call 을 사용하며, 첫번째 값을 명령으로, 두번째 배열 이후의 값들을 프로그램에 인자로 바로 전달한다.

결론 : 선언형 스크립트에서는 컨테이너에서 실행될  쉘 해석기의 도움을 받아 프로그램에 명령을 전달하던 방식을 쓰지 않는다. 배열로 전달한다.