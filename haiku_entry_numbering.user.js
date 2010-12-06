// ==UserScript==
// @name           haiku_entry_numbering
// @namespace      http://d.hatena.ne.jp/fumokmm/
// @description    haiku_entry_numbering
// @include        http://h.hatena.ne.jp/keyword/*
// @author         fumokmm
// @date           2010-12-06
// @version        0.01
// ==/UserScript==

(function() {
    /**
     * メイン処理
     */
    var main = function(nodes) {
	// 現在のキーワード
	// TODO: ページの分解
	var searchKeyword = location.href.replace('http://h.hatena.ne.jp/keyword/', '')

	// API呼び出し
	GM_xmlhttpRequest({
	    method: 'GET',
	    url   : 'http://h.hatena.ne.jp/api/keywords/show/' + searchKeyword + '.json',
	    onload: function(httpObj) {
		/*--- JSON sample
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
		---*/
		var info = eval("(" + httpObj.responseText + ")")
		callback(info)
	    }
	})

	// API問い合わせ後、呼ばれる関数
	function callback(keywordInfo) {
	    // TODO: アラートはやめる
	    alert(keywordInfo.title + "の現在のエントリ数は" + keywordInfo.entry_count + "です。")
	    // TODO: 番号をエントリに埋め込む
	}
    }

    //メイン処理を実行
    main([document])

    // (by http://os0x.g.hatena.ne.jp/os0x/20080131/1201762604)
    setTimeout(function() {
	if (window.AutoPagerize && window.AutoPagerize.addFilter) {
	    window.AutoPagerize.addFilter(main)
	} else {
	    window.addEventListener('GM_AutoPagerizeLoaded', function(){
		window.AutoPagerize.addFilter(main)
	    }, false)
	}
    }, 0)

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
