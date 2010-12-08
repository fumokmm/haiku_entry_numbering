// ==UserScript==
// @name           haiku_entry_numbering
// @namespace      http://d.hatena.ne.jp/fumokmm/
// @description    haiku_entry_numbering
// @include        http://h.hatena.ne.jp/keyword/*
// @author         fumokmm
// @date           2010-12-08
// @version        0.01
// ==/UserScript==

// TODO: キーワードタイムライン以外も対応

(function() {
    function Queue() {
	this._a = []
	this.enqueue = function(o) {
	    this._a.push(o)
	}
	this.dequeue = function() {
	    if (this._a.length > 0) {
		return this._a.shift()
	    }
	    return null
	}
	this.size = function() {
	    return this._a.length
	}
 	this.contains = function(o) {
	    var s = this.size()
	    for (var i = 0; i < s; i++) {
		if (this._a[i] == o) return true
	    }
	    return false
	}
	this.toString = function() {
	    return '[' + this._a.join(', ') + ']'
	}
    }

    var DataStore = function() {
	this.limit = 100
	this.list = new Queue()
	this.map = {}
	this.update = function(key, value) {
	    if (this.list.contains(key)) {
		if (this.map[key] != value) {
		    this.map[key] = value
		}
	    } else {
		if (this.list.size() == this.limit) {
		    var deletedKey = this.list.dequeue()
		    delete this.map[deletedKey]
		}
		this.list.enqueue(key)
		this.map[key] = value
	    }
	}
	this.get = function(key) {
	    
	}
    }






    // --------------------------------------------------------------
    // 定数定義

    // IDのプレフィックス
    var NUMBER_TEMPLATE = '$num: ';

    // TODO: データストアからデータを取得

    // 現在のキーワード
    var searchKeywordInfo = getKeywordInfo()
    searchKeywordInfo.nowNumber = -1
    var apiInfo = null
    // API呼び出し
    GM_xmlhttpRequest({
        method: 'GET',
        url   : 'http://h.hatena.ne.jp/api/keywords/show/' + searchKeywordInfo.keyword + '.json',
        onload: function(httpObj) {
	    /*======= NOTE ====== [JSON sample] ==
	    {
	      "related_keywords" : [
	        "xxx",
	        "yyy"
	      ],
	      "link" : "http://h.hatena.ne.jp/keyword/zzz",
	      "followers_count" : "1",
	      "title" : "zzz",
	      "entry_count" : "213"
	    }
	    ======================================*/
	    apiInfo = eval('(' + httpObj.responseText + ')')
            //メイン処理を実行
	    main([document], apiInfo)
        }
    })

    // AutoPagerizeで継ぎ足されたページでもメイン処理を実行できるように登録
    // (by http://os0x.g.hatena.ne.jp/os0x/20080131/1201762604)
    setTimeout(function() {
	if (window.AutoPagerize && window.AutoPagerize.addFilter) {
	    window.AutoPagerize.addFilter(function(){ main([document], apiInfo) })
	} else {
	    window.addEventListener('GM_AutoPagerizeLoaded', function(){
		window.AutoPagerize.addFilter(function(){ main([document], apiInfo) })
	    }, false)
	}
    }, 0)

    /**
     * メイン処理
     */
    function main(nodes, apiInfo) {
        // 現在のキーワードのエントリ数
        var number = apiInfo.entry_count - (searchKeywordInfo.page - 1) * 20
	if (searchKeywordInfo.nowNumber == -1) searchKeywordInfo.nowNumber = number

	nodes.forEach(function(node){
            // タイトルのh2要素を取得
            var titles = xpath("descendant-or-self::div[@class='entry']/div[@class='list-body']/h2[@class='title']", node)
	    // TODO: ステータスIDも取得
	    titles.forEach(function(titleNode) {
		// number が nowNumber 以下になったら実行
		if (number <= searchKeywordInfo.nowNumber) {
		    // TODO: データストアから取得できたらその値を使う
		    // if (dataStore.contains(statusId)) {
                    //     dataStore.update(statusId, number)
		    //     var num = dataStore.get(statusId)
		    // }
		    // TODO: ただし更新してから(最新の番号優先) ⇒データストアに保存
		    // TODO: 取得できなかったら、現在の値を反映して番号を付ける
	            // 番号のspan要素を生成
                    var numberNode = document.createElement('span')
                    numberNode.appendChild(document.createTextNode(NUMBER_TEMPLATE.replace('$num', number)))
                    // 生成した番号のspan要素をタイトルの前に追加
                    titleNode.insertBefore(numberNode, titleNode.firstChild)
	        }
                number--
            })
	})

        searchKeywordInfo.nowNumber = number
	// TODO: データストアに現在のデータの状態を反映
    }

    /**
     * キーワード情報を取得
     * @return [keyword: キーワード, page: ページ番号]
     */
    function getKeywordInfo() {
        var qsMap = null
        var qs = location.search.substr(1)
        if (qs) {
            qs = qs.split('&')
	    for (var i = 0; i < qs.length; i++) {
	        var kv = qs[i].split('=')
                if (qsMap == null) qsMap = {}
	        qsMap[kv[0]] = kv[1]
            }
        }
	if (qsMap == null) qsMap = {page: 1}
	return {
	    keyword: location.pathname.replace(/^\/keyword\//, ''),
            page   : Number(qsMap.page)
	}
    }

    // --------------------------------------------------------------
    // XPath処理の関数

    /**
     * XPathを便利に扱う関数 (by http://yamanoue.sakura.ne.jp/blog/coding/68)
     * @param query
     * @param context
     */
    function xpath(query, context) {
	context || (context = document)
	var results = document.evaluate(query, context, null,
					XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null)
	var nodes = []
	for (var i = 0; i < results.snapshotLength; i++) {
	    nodes.push(results.snapshotItem(i))
	}
	return nodes
    }

    // --------------------------------------------------------------

})()
