const axios = require("axios");

const data = {
  questions: [
    {
      question_id: 1,
      question: "Marmite...",
      startTime: "2020-02-27T20:00:00.000Z",
      img: "https://i.postimg.cc/7ZPTGpGR/marmite.jpg",
      questionStatus: "current",
      answerArray: [
        '{"answer":"Love it!","img":"answer photo"}',
        '{"answer":"Hate it!","img":"answer photo"}'
      ]
    }
  ]
};
const letterOptions = ["A", "B", "C", "D", "E", "F", "G"];
const answers = data.questions[0].answerArray.map(function(answer) {
  const answerObject = JSON.parse(answer);
  return answerObject.answer;
});
const questionText = data.questions[0].question;
const lastAnswer = answers.length - 1;
const speechText = answers.reduce(function(speechText, answer, index) {
  if (index !== lastAnswer) {
    return speechText + ` answer ${letterOptions[index]}, ${answer}`;
  } else if (index === lastAnswer && index === 1) {
    return speechText + ` and answer ${letterOptions[index]}, ${answer}...`;
  } else {
    return (
      speechText +
      ` and finally... answer ${letterOptions[index]}, ${answer}...`
    );
  }
}, `Today's question is... ${questionText}. The answers are...`);

async function testFunc() {
  const question_id = "1";
  const userUid = "1";
  const response = await axios.get(
    `https://pollcat-backend.herokuapp.com/api/questions/${question_id}/answers?userUid=${userUid}`
  );
  console.log(response.data);
}

testFunc();
