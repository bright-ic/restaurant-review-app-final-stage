
//importScripts('idb.js'); // add the idb library
if('function' === typeof importScripts) {
    importScripts('idb.js');
    importScripts('dbhelper.js');
    console.log('imported');
}
/* +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
onmessage = (e) => {
    const data = e.data;
    if(data === 'retryPostingFailedReviews') {
        retryPostingFailedReview();
    }
}
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
retryPostingFailedReview = (data='') => {
    console.log('Retrying data posting');
    let resultData = {
        'ops': 'retyReviewPosting',
        'msg': null,
        'error': true,
        'origin': 'webWorker'
    };
    DBHelper.retryReviewPost(data, (error, success) =>{
    if(error) { // failed to save to idb,.\\. Retry after 5 munites
        //setTimeout(retryPostingFailedReview(data), 3000000); // retry in 5 munites
        resultData.msg = error;
    } else{
        // review was submitted successfully.
        if(success) {
            DBHelper.clearAllPendingReviews(); // remove pending review data from idb
            resultData.msg = success;
            resultData.error = false;
        }
    }

    postMessage(resultData);
    });
  }