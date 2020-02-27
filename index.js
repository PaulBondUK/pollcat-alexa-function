// Include the Alexa SDK v2
const Alexa = require("ask-sdk-core");
const axios = require("axios");

// The "LaunchRequest" intent handler - called when the skill is launched
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === "LaunchRequest";
  },
  handle(handlerInput) {
    const speechText =
      "Welcome to Pollcat. Would you like to vote in today's poll, or hear the latest results?";
    const repromptText =
      "tell me if you want to vote in today's poll, or hear the latest results";

    // Speak out the speechText via Alexa
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  }
};

const questionHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "questionIntent"
    );
  },
  async handle(handlerInput) {
    const { data } = await axios.get(
      `https://pollcat-backend.herokuapp.com/api/questions?questionStatus=current`
    );
    const letterOptions = ["A", "B", "C", "D", "E", "F", "G"];
    const answers = data.questions[0].answerArray.map(function(answer) {
      const answerObject = JSON.parse(answer);
      return answerObject.answer;
    });
    const questionText = data.questions[0].question;
    const lastAnswer = answers.length - 1;
    const questionsAndAnswers = answers.reduce(function(
      speechText,
      answer,
      index
    ) {
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
    },
    `Today's question is... ${questionText}. The answers are...`);
    const speechText = `${questionsAndAnswers}. Which would you like to vote for?`;
    const repromptText = `You can choose an answer, or cancel`;
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt("test two")
      .getResponse();
  }
};

const answerHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "answerIntent"
    );
  },
  async handle(handlerInput) {
    // const { data } = await axios.post(
    //   `https://pollcat-backend.herokuapp.com/api/answers`
    // );
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();
    let speechText;
    try {
      const letterOptions = {
        a: 0,
        b: 1,
        c: 2,
        d: 3,
        e: 4,
        f: 5
      };
      const { data } = await axios.get(
        `https://pollcat-backend.herokuapp.com/api/questions?questionStatus=current`
      );
      const { question_id } = data.questions[0];
      const answerOption =
        handlerInput.requestEnvelope.request.intent.slots.letter.value;
      const answerIndex = letterOptions[answerOption];
      const { response } = await axios.post(
        `https://pollcat-backend.herokuapp.com/api/answers`,
        {
          question_id,
          userUid: 2,
          answerIndex,
          townName: "Manchester",
          countyName: "Greater Manchester"
        }
      );
      const answerObject = data.questions[0].answerArray[answerIndex];
      const parsedAnswerObject = JSON.parse(answerObject);
      const chosenOption = parsedAnswerObject.answer;

      speechText = `Your vote for ${chosenOption} has been recorded`;
    } catch {
      speechText = `Sorry. Your vote could not be saved`;
    }

    // const userUid =
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt("test two")
      .getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(LaunchRequestHandler, questionHandler, answerHandler)
  .lambda();
