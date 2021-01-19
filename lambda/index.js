const Alexa = require('ask-sdk-core');
const https = require('https');

const HARDCODED_JOB_ID = ''; 
const HARDCODED_JOB_NOTE_ID = ''; 
const HARDCODED_LIST_ID = ''; 
const API_KEY = ''; 
const errorOutput = `I'm sorry there was an error with that request.`; 

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Ask me something about Crelate';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};


/**
 *  Creates a note on a designated job
 */
const CreateNoteOnJobHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CreateNoteOnJobIntent'; 
    }, 
    async handle(handlerInput) {
        try {
            const userRequest = Alexa.getSlotValue(handlerInput.requestEnvelope, 'noteBody'); 
            
            const noteOptions = JSON.stringify({
                Pinned: true, 
                Body: userRequest
            }); 
            
            const options = {
                method: "POST", 
                hostname: "app.crelate.com", 
                path: `/api/pub/v1/jobs/${HARDCODED_JOB_NOTE_ID}/notes?api_key=${API_KEY}`, 
                headers: {
                    "Content-Type": "application/json", 
                    "Content-Length": noteOptions.length
                }
            }; 
            
            const responseString = await postHttp(options, noteOptions); 
            console.log(`Response String: ${responseString}`); 
            
            const response = JSON.parse(responseString); 
            
            let speakOutput = (response.Id) ? "Okay, I have successfully added the note." : "I'm sorry, there was an error with that request. Can you try again?"; 
            
            handlerInput.responseBuilder
                .speak(speakOutput); 
            
            return handlerInput.responseBuilder
                .getResponse();
                
        } catch(error) {
            console.log(error); 
            handlerInput.responseBuilder
            .speak(errorOutput); 
        }
    }
}; 

/**
 * Given a designated list - gives details about the list, how many records & reads off at most 3 records on the list
 */
const ListInfoHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ListInfoIntent'; 
    }, 
    async handle(handlerInput) {
        const URL = `https://app.crelate.com/api/pub/v1/contacts/lists/${HARDCODED_LIST_ID}?api_key=${API_KEY}`;
        
        try {
            const responseString = await getHttp(URL); 
            const response = JSON.parse(responseString); 
            
            let speakOutput = ""; 
            let listLength = response.Results.length; 
            
            console.log(listLength); 
            
            if(listLength > 0)
            {
                let take = (listLength < 3) ? listLength : 3; 
                
                speakOutput += `There are ${listLength} contacts on this list. Here are some of the contacts on this list.`; 
                
                let contacts = response.Results; 
                for(var i = 0; i < take; i++)
                {
                    const contact = contacts[i]; 
                    let name = `${contact.FirstName} ${contact.LastName}`; 
                    
                    if(contact.NickName)
                    {
                        speakOutput += ` ${name}, also known as ${contact.NickName}.`; 
                    }
                    else 
                    {
                        speakOutput += ` ${name}.`; 
                    }
                }
            }
            else 
            {
                speakOutput = "There are no contacts on this list.";    
            }
            
            handlerInput.responseBuilder
                .speak(speakOutput); 
            
            return handlerInput.responseBuilder
                .getResponse();
            
        } catch(error) {
            console.log(error); 
            handlerInput.responseBuilder
                .speak(errorOutput); 
        }
    }
}; 

/**
 * Read off the most recent (up to 3) notes on a job
 */
const JobNotesHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'JobNotesIntent'; 
    }, 
    async handle(handlerInput) {
        const URL = `https://app.crelate.com/api/pub/v1/jobs/${HARDCODED_JOB_ID}/notes?take=3&api_key=${API_KEY}`; 
        
        try {
            const responseString = await getHttp(URL); 
            const response = JSON.parse(responseString); 
            
            let speakOutput = ""; 
            
            const notes = response.Results; 
            for(var i = 0; i < notes.length; i++)
            {
               // TODO: Add null or undefined helper
               var note = notes[i]; 
               if(note.Body)
               {
                    speakOutput += note.Body;    
               }
               
               handlerInput.responseBuilder
                .speak(speakOutput); 
            }
            
            return handlerInput.responseBuilder
                .getResponse();
            
        } catch(error) {
            console.log(error); 
            handlerInput.responseBuilder
                .speak(errorOutput); 
        }
    }
}; 

/**
 * Says the number of applicants for a designated job
 */
const GetNumberApplicationsHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetNumberApplicationsIntent';
    },
    async handle(handlerInput) {

        let speakOutput = errorOutput;
        const URL = `https://app.crelate.com/api/pub/v1/jobs/${HARDCODED_JOB_ID}/applications?api_key=${API_KEY}`; 
       
        try {
            const responseString = await getHttp(URL);
            const response = JSON.parse(responseString); 
            
            const appNum = response.Results.length; 
            
            console.log(appNum); 
            
            if(appNum >= 1)
            {
                speakOutput = `You have ${appNum} applications for the Full Stack Developer position.`; 
            }
            else
            {
                speakOutput = `You have no applications for the Full Stack Developer position`; 
            }
            
            handlerInput.responseBuilder
                .speak(speakOutput)
               
        } catch(error) {
            console.log(error); 
            handlerInput.responseBuilder
                .speak(errorOutput); 
        }
       
        return handlerInput.responseBuilder
            .getResponse();
    }
};

/**
 * Helper http function for GETs
 * @param {url to GET} url 
 */
const getHttp = function(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(`${url}`, response => {
            response.setEncoding('utf8');
           
            let returnData = '';
            if (response.statusCode < 200 || response.statusCode >= 300) {
                return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
            }
           
            response.on('data', chunk => {
                returnData += chunk;
            });
           
            response.on('end', () => {
                resolve(returnData);
            });
           
            response.on('error', error => {
                reject(error);
            });
        });
        request.end();
    });
}; 

// TODO: Consolidate
/**
 * Helper http function
 * @param {full http request} options 
 * @param {post data to include} data 
 */
const postHttp = function(options, data) {
    return new Promise((resolve, reject) => {
        const request = https.request(options, response => {
            response.setEncoding('utf8'); 
            
            let returnData = ''; 
            if(response.statusCode < 200 || response.statusCode >= 300) {
                return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`)); 
            }
            
            response.on('data', chunk => {
                returnData += chunk; 
            }); 
            
            response.on('end', ()=> {
                resolve(returnData);
            }); 
            
            response.on('error', (error) => {
                reject(error); 
            }); 
        }); 
        
        request.write(data); 
        request.end(); 
    }); 
}; 


const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        CreateNoteOnJobHandler, 
        ListInfoHandler, 
        JobNotesHandler, 
        GetNumberApplicationsHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();