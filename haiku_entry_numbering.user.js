// ==UserScript==
// @name           haiku_entry_numbering
// @namespace      http://d.hatena.ne.jp/fumokmm/
// @description    haiku_entry_numbering
// @include        http://h.hatena.ne.jp/*
// @author         fumokmm
// @date           2010-12-11
// @version        0.02
// ==/UserScript==

(function() {

    // --------------------------------------------------------------
    // 定数定義

    // モード
    const MODE = getMode()

    // データストアキー
    function DS_KEY(){}
    DS_KEY.NUMBER_TEMPLATE = 'number_template'
    DS_KEY.STATUS_ID_NUMBER_MAP = 'statusid_number_map'
    DS_KEY.STATUS_ID_SAVE_COUNT = 'statusid_save_count'

    // データストアからデータを取得
    var numberTeplate = GM_getValue(DS_KEY.NUMBER_TEMPLATE, '$num: ')
    var saveCount = GM_getValue(DS_KEY.STATUS_ID_SAVE_COUNT, 1000)
    var dataStore = eval('(' + GM_getValue(DS_KEY.STATUS_ID_NUMBER_MAP, new DataStore(saveCount).toSource()) + ')')
    if (! (dataStore.limit && dataStore.limit() == saveCount)) {
        dataStore =  new DataStore(saveCount)
        GM_setValue(DS_KEY.STATUS_ID_NUMBER_MAP, dataStore.toSource())
    }

    // 現在のキーワード
    var searchKeywordInfo = getKeywordInfo()
    var apiInfo = null
    var callMain = null

    switch (MODE) {
        case 'keyword' :
            searchKeywordInfo.nowNumber = -1
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
                    mainForKeyword([document], apiInfo)
                }
            })
            break

        case 'settings' :
            callMain = function(){ mainForSettings([document]) }
            break

        default :
            callMain = function(){ main([document]) }
            break
    }

    if (callMain) callMain()
    else callMain = function(){ mainForKeyword([document], apiInfo) }

    // AutoPagerizeで継ぎ足されたページでもメイン処理を実行できるように登録
    // (by http://os0x.g.hatena.ne.jp/os0x/20080131/1201762604)
    setTimeout(function() {
	if (window.AutoPagerize && window.AutoPagerize.addFilter) {
	    window.AutoPagerize.addFilter(callMain)
	} else {
	    window.addEventListener('GM_AutoPagerizeLoaded', function(){
		window.AutoPagerize.addFilter(callMain)
	    }, false)
	}
    }, 0)

    /**
     * メイン処理(キーワードページ用)
     */
    function mainForKeyword(nodes, apiInfo) {
        // 現在のキーワードのエントリ数
        var number = apiInfo.entry_count - (searchKeywordInfo.page - 1) * 20
	nodes.forEach(function(node){
            // タイトルのh2要素を取得
            var titles = xpath("descendant-or-self::div[@class='entry']/div[@class='list-body']/h2[@class='title']", node)
	    titles.forEach(function(titleNode) {
　　　　　　      // ステータスIDを取得
                var infoNode = xpath("descendant::div[@class='info']/span[@class='timestamp']", titleNode.parentNode)[0]
                var statusId = infoNode.firstChild.href.replace(/^.+\//, '')
                // データストアに情報を設定
                dataStore.update(statusId, number)

                // まだ追加していなければ実行
                if (titleNode.firstChild.tagName.toLowerCase() != 'span') {
	            // 番号のspan要素を生成
                    var numberNode = document.createElement('span')
                    numberNode.appendChild(document.createTextNode(numberTeplate.replace('$num', number)))
                    // 生成した番号のspan要素をタイトルの前に追加
                    titleNode.insertBefore(numberNode, titleNode.firstChild)
	        }
                number--
            })
	})
        // データストア保存
        GM_setValue(DS_KEY.STATUS_ID_NUMBER_MAP, dataStore.toSource())
    }

    /**
     * メイン処理(キーワードページ以外)
     */
    function main(nodes) {
	nodes.forEach(function(node){
            // タイトルのh2要素を取得
            var titles = xpath("descendant-or-self::div[@class='entry']/div[@class='list-body']/h2[@class='title']", node)
	    titles.forEach(function(titleNode) {
　　　　　　      // ステータスIDを取得
                var infoNode = xpath("descendant::div[@class='info']/span[@class='timestamp']", titleNode.parentNode)[0]
                var statusId = infoNode.firstChild.href.replace(/^.+\//, '')
                var number = dataStore.getValue(statusId)
                if (number) {
                    // まだ追加していなければ実行
	            if (titleNode.firstChild.tagName.toLowerCase() != 'span') {
	                // 番号のspan要素を生成
                        var numberNode = document.createElement('span')
                        numberNode.appendChild(document.createTextNode(numberTeplate.replace('$num', number)))
                        // 生成した番号のspan要素をタイトルの前に追加
                        titleNode.insertBefore(numberNode, titleNode.firstChild)
	            }
                }
            })
	})
    }

    /**
     * メイン処理(キーワードページ以外)
     */
    function mainForSettings(nodes) {
	nodes.forEach(function(node){
            // タイトルのh2要素を取得
            var sectionNode = xpath("descendant-or-self::div[@class='section']", node)[0]

            var fieldSetNode = document.createElement('fieldset')
            fieldSetNode.setAttribute('class', 'config')

            sectionNode.appendChild(fieldSetNode)

            var legendNode = document.createElement('legend')
            legendNode.appendChild(document.createTextNode('haiku_entry_numbering'))

            var tableNode = document.createElement('table')
            tableNode.setAttribute('class', 'config')
            
            fieldSetNode.appendChild(legendNode)
            fieldSetNode.appendChild(tableNode)

            var tbodyNode = document.createElement('tbody')

            tableNode.appendChild(tbodyNode)

            var tr1Node = document.createElement('tr')

            tbodyNode.appendChild(tr1Node)

            var th1Node = document.createElement('th')
            th1Node.setAttribute('class', 'row')
            th1Node.appendChild(document.createTextNode('テンプレート'))
            var td1Node = document.createElement('td')
            var input1Node = document.createElement('input')
            input1Node.setAttribute('type', 'text')
            input1Node.setAttribute('value', numberTeplate)
            td1Node.appendChild(input1Node)

            tr1Node.appendChild(th1Node)
            tr1Node.appendChild(td1Node)

            var tr2Node = document.createElement('tr')

            tbodyNode.appendChild(tr2Node)

            var th2Node = document.createElement('th')
            th2Node.setAttribute('class', 'row')
            th2Node.appendChild(document.createTextNode('保存数'))
            var td2Node = document.createElement('td')
            var input2Node = document.createElement('input')
            input2Node.setAttribute('type', 'text')
            input2Node.setAttribute('value', saveCount)
            td2Node.appendChild(input2Node)

            tr2Node.appendChild(th2Node)
            tr2Node.appendChild(td2Node)
	})
    }

    /**
     * 'keyword' or 'settings' or 'normal'
     */
    function getMode() {
        var pathname = location.pathname
        if (pathname.search('/keyword') >= 0) return 'keyword'
        if (pathname.search('/settings') >= 0) return 'settings'
        return 'normal'
    }

    /**
     * キーワード情報を取得
     * @return キーワードページの場合   : [keyword: キーワード, page: ページ番号]
     *         キーワードページ以外の場合: undefined
     */
    function getKeywordInfo() {
        if (MODE != 'keyword') return undefined
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
    function DataStore(limit) {
        this._limit = limit
	this._a = []
        this._m = {}

	this._enqueue = function(o) {
	    this._a.push(o)
	}
	this._dequeue = function() {
	    if (this.size() > 0) {
		return this._a.shift()
	    }
	    return null
	}
	this.size = function() {
	    return this._a.length
	}
        this.limit = function() {
            return this._limit
        }
 	this.contains = function(o) {
            return this._m[o] !== undefined
	}
        this.update = function(k, v) {
            if (this.contains(k)) {
	        this._m[k] = v                    
            } else {
                while (! (this.size() < this._limit)) {
                    delete this._m[this._dequeue()]
                }
                this._enqueue(k)
                this._m[k] = v
            }
        }
        this.getValue = function(k) {
            return this._m[k]
        }
	this.toString = function() {
	    var result = '[' + this._a.join(', ') + ']\n'
            result += '{'
            for (key in this._m) result += (key + '=' + this._m[key] + ' ')
            result += '}'
            return result
	}
    }

    // --------------------------------------------------------------

})()
