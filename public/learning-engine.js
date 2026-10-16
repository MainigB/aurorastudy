(function(root){
 function checkQuiz(lesson,index){return Number.isInteger(index)&&index===lesson.correct;}
 function sameResult(actual,expected){return JSON.stringify(actual)===JSON.stringify(expected);}
 const api={checkQuiz,sameResult};root.AuroraLearning=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
