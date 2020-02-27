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
      "Would you like to vote in today's poll, or hear the latest results";

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
    try {
      const userUid = "1";
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
      let questionsAndAnswers = answers.reduce(function(
        speechText,
        answer,
        index
      ) {
        if (index !== lastAnswer) {
          return speechText + ` answer ${letterOptions[index]}, ${answer}`;
        } else if (index === lastAnswer && index === 1) {
          return (
            speechText + ` and answer ${letterOptions[index]}, ${answer}...`
          );
        } else {
          return (
            speechText +
            ` and finally... answer ${letterOptions[index]}, ${answer}...`
          );
        }
      },
      `Today's question is... ${questionText}. The answers are...`);
      speechText = `${questionsAndAnswers}. Which would you like to vote for?`;
    } catch (err) {
      speechText = `sorry, there was an error with that`;
    }

    const repromptText = `Choose an answer, or say cancel`;
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
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
    const userUid = "1";
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
          userUid,
          answerIndex,
          townName: "Manchester",
          countyName: "Greater Manchester"
        }
      );
      // const responseAnswerIndex = response.answer.answerIndex;
      const answerObject = data.questions[0].answerArray[answerIndex];
      const parsedAnswerObject = JSON.parse(answerObject);
      const chosenOption = parsedAnswerObject.answer;

      speechText = `Your vote for ${chosenOption} has been recorded`;
    } catch (err) {
      speechText = `Sorry. Your vote could not be saved`;
    }

    // const userUid =
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt("which answer you would you like to submit")
      .getResponse();
  }
};

const resultsHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "yesterdayResult"
    );
  },
  async handle(handlerInput) {
    let speechText;
    try {
      const { data } = await axios.get(
        `https://pollcat-backend.herokuapp.com/api/questions?questionStatus=past`
      );
      const questionText = data.questions[0].question;
      const { answerArray } = data.questions[0];
      const parsedAnswerArray = answerArray.map(answer => {
        return JSON.parse(answer);
      });
      parsedAnswerArray.sort((a, b) => b.votes - a.votes);
      const winningAnswer = parsedAnswerArray[0];
      const runnerUpAnswer = parsedAnswerArray[1];
      console.log(answerArray, questionText, parsedAnswerArray, winningAnswer);
      speechText = `The latest poll was ${questionText}. the results are in and the winner was... drumroll please... ${winningAnswer.answer} with ${winningAnswer.votes} votes... my pick would have been ${runnerUpAnswer.answer}, but only ${runnerUpAnswer.votes} people agreed.`;
    } catch (err) {
      speechText = `Hmm. I can't get the results just now.`;
    }

    return handlerInput.responseBuilder.speak(speechText).getResponse();
  }
};

const ExitHandler = {
  canHandle(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;

    return (
      request.type === `IntentRequest` &&
      (request.intent.name === "AMAZON.StopIntent" ||
        request.intent.name === "AMAZON.PauseIntent" ||
        request.intent.name === "AMAZON.CancelIntent")
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak(exitSkillMessage).getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    console.log("Inside SessionEndedRequestHandler");
    return handlerInput.requestEnvelope.request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    console.log(
      `Session ended with reason: ${JSON.stringify(
        handlerInput.requestEnvelope
      )}`
    );
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak("Sorry, I can't understand the command. Please say again.")
      .reprompt("Sorry, I can't understand the command. Please say again.")
      .getResponse();
  }
};

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    questionHandler,
    answerHandler,
    resultsHandler,
    ErrorHandler,
    SessionEndedRequestHandler,
    ExitHandler
  )
  .lambda();
