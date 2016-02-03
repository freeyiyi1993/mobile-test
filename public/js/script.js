$(function() {
    'use strict';
    var scope = $('#listsPage'),
        win = $(window),
        start = 0,
        hasMore = false,
        didScroll = false,
        isLoading = false,

        // isExpand = false,
        // scrollTop = 0,
        // APIs = window.APIs,
        // redirect = window.redirect,
        // share = window.share,
        firstPage = true,
        loading = scope.find('.loading'),
        noMoreData = scope.find('.center'),
        // options = window.options,
        loadDataUrl = 'http://test.mama.sm.cn/ApiMama/lists?query=奶粉&sign=36fd90e11e7c8d3418aa8f96e0f51ffa',
        // recApi = APIs.recAPI,
        // redirectUrl = redirect.redirectUrl,
        // domain = redirect.domain,
        // shareObj = share || {},
        isSupportShare = true,
        tpl = tpl = function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
__p+='';
 var list = obj.list
__p+='\n';
 var isSupportShare = obj.isSupportShare
__p+='\n';
 var log = obj.log
__p+='\n';
 for (var i = 0; i < list.length; i++) {
__p+='\n';
 var item = list[i]
__p+='\n    ';
 if(item.doctor_name && item.doctor_title) {
__p+='\n    <article id="muying_article_'+
((__t=( log++ - 20 ))==null?'':__t)+
'" data-article>\n        <div class="panel-top">\n            <a href="'+
((__t=( item.info_url ))==null?'':__t)+
'" data-log="21">\n                <h2 class="multi-cut clamp-2">'+
((__t=( item.title ))==null?'':__t)+
'</h2>\n            </a>\n            <img class="avatar" src="'+
((__t=( item.doctor_img ))==null?'':__t)+
'"/>\n            <h3 class="authority multi-cut clamp-2">'+
((__t=( item.doctor_name ))==null?'':__t)+
'</h3>\n            <small class="single-cut">'+
((__t=( item.doctor_title ))==null?'':__t)+
'</small>\n        </div>\n        <div class="desc">\n            <a href="'+
((__t=( item.info_url ))==null?'':__t)+
'" data-log="22">\n                <div class="content">'+
((__t=( item.content ))==null?'':__t)+
'</div>\n            </a>\n            <div class="source">\n                ';
 if (item.url) {
__p+='\n                <a href="'+
((__t=( item.url ))==null?'':__t)+
'" data-log="1">原文链接</a>\n                ';
 }
__p+='\n                ';
 if (isSupportShare) {
__p+='\n                <i class="v-line"></i> <a href="javascript:;" class="share" data-log="2">分享给好友</a>\n                ';
 }
__p+='\n            </div>\n        </div>\n        <a class="panel-btm" href="'+
((__t=( item.info_url ))==null?'':__t)+
'" data-log="20">\n            查看全文\n        </a>\n    </article>\n    ';
 }
__p+='\n\n';
 }
__p+='';
return __p;
},
        // tplFooter = __inline('/tmpl/footer.tmpl'),
        loadData = function (url, args, success, error) {
            $.ajax({
                url: url,
                data: args,
                timeout: 1000,
                dataType: 'jsonp',
                success: function (data) {
                    success(data);
                },
                error: function (xhr, textStatus) {
                    error(xhr, textStatus);
                }
            });
        };

    function endLoad() {
        hasMore = false;
        loading.hide();
        isLoading = false;
        noMoreData.css({visibility: 'visible'});
        // alert('noMoreData');
    }

    function showError() {
        firstPage = false;
        // loading.before(tplError({}));
        alert('error');
        loading.hide();
        isLoading = false;
    }

    function loadMore() {
        if (isLoading) {
            return;
        }
        didScroll = false;
        isLoading = true;

        loadData(loadDataUrl, {start: start}, function (res) {
            var data = res.data,
                list = data.list,
                log = start == 0 ? 20 : start + 21;

            start = data.nextStart;
            hasMore = data.hasMore;
            firstPage = log == 20;

            if (res.status === 0) {
                if (firstPage) {
                    if (list.length === 0) {
                        showError();
                        return;
                    } else {
                        // loadRec();
                        // noMoreData.after(tplFooter({}));
                    }
                }
                !hasMore && endLoad();

                isLoading = false;
                var html = tpl({list: list, isSupportShare: isSupportShare, log: log});

                loading.before(html);
                // haddleArticle();
            } else {
                firstPage ? showError() : endLoad();
            }
            firstPage = false;
        }, function (xhr, status) {
            // alert('error');
            // alert(JSON.stringify(xhr));
            alert(JSON.stringify(status));
            firstPage ? showError() : endLoad();
        });
    }

    loadMore();

    win.on('scroll', function () {
        didScroll = true;
    });

    setInterval(function () {
        if (hasMore && didScroll) {
            if (win.scrollTop() + screen.height > noMoreData.offset().top) {
                loadMore();
            }
        }
    }, 300);
});