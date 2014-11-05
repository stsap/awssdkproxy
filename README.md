awssdkproxy
===========
受け取ったリクエストを[AWS SDK for JavaScript in Node.js](http://aws.amazon.com/jp/sdkfornodejs/) を通してAWSに投げるNode.js製HTTPサーバっぽいゴミ。

[AWS SDK for JavaScript in the Browser](http://aws.amazon.com/jp/sdk-for-browser/) のSupported Servicesの拡充を待ちきれなかった。

起動
-------
    # npm install
    # node index.js

使い方
------
レスポンスヘッダに``Access-Control-Allow-Origin: *`` が問答無用で追加されているのでクロスドメイン制約には引っかからないはずです。  
``http://localhost:8080/EC2/describeRegions`` 等、リクエストURLのパスの最初にAWSSDKのサービスクラス名、その後にメソッド名を指定してPOSTなりGETなりでリクエストします。  
大文字、小文字は厳密に区別され、存在しないクラス名、メソッド名が指定された場合には特に親切なエラーを吐きません。  
AWS-SDKのクラス名、メソッド名については公式を参照。  
http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/frames.html

リクエストパラメータを付けてリクエストすると該当メソッドにそのまま渡されます。

使用例(jQuery)
------
    $.get("http://localhost:8080/EC2/describeRegions")
        .then(function (result) { console.log(result); });
