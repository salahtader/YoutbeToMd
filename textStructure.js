const { GoogleGenerativeAI } = require('@google/generative-ai');// async function structureText(unstructuredText, language) {
// const GoogleAPIKEY = 'AIzaSyA7zDurVXNB8rv63acNbmjIPjBOEGURpNM' ; 
// const genAI = new GoogleGenerativeAI(GoogleAPIKEY);


// const unstructuredText =" on continue d'évoluer dans ce range qui a l'air un peu pourri comme ça, mais si on dézoome un peu, regardez bien, regardez l'effet que ça fait dans le passé. Alors, je sais qu'on en parle régulièrement, mais c'est très important à surveiller, puisque si on pète trucs à la hausse, ça risque d'être très bullish par la suite, simplement parce que là, regardez bien, on a pété à la hausse, petit effet 60 de ce range, on a pété à la hausse, énorme pump,";
// const language = 'french';
async function structureText(unstructuredText, language,GoogleAPIKEY, prompt) {
    const genAI = new GoogleGenerativeAI(GoogleAPIKEY);
//     const prompt = `
//      The following transcript of a video poadcast . Please detailed ,complete  transcript and structure it with appropriate titles and summary of steps and a table of contents   :

//     ${unstructuredText}
//     `;
// const promptText =`Objectif : Traduire la transcription suivante d'une vidéo tutoriel de la langue source $ {langue} vers le français. La traduction doit être détaillée, complète et bien structurée.
// Instruction :
// Introduction et Contexte :
// Présentez brièvement le sujet de la vidéo tutoriel.
// Expliquez l'importance de ce tutoriel et ce que les apprenants pourront en tirer.
// Table des Matières :
// Créez une table des matières pour organiser les sections principales du tutoriel. Incluez les titres et sous-titres pertinents pour chaque étape importante.
// Traduction des Sections :
// Traduisez chaque section du tutoriel. Assurez-vous d'inclure les explications, les descriptions et les étapes pratiques.
// Utilisez des titres appropriés pour chaque section et sous-section.
// Soyez clair et précis dans la traduction pour faciliter la compréhension des apprenants.
// Résumé des Étapes :
// À la fin de la traduction, résumez les étapes principales du tutoriel.
// Mettez en évidence les points clés et les conseils pratiques donnés dans la vidéo.
// Conclusion :
// Terminez par une conclusion qui récapitule l'importance du tutoriel et encourage les apprenants à appliquer ce qu'ils ont appris.
// transcription :
// ${unstructuredText}`
    const promptText = `
     The following transcript of a video . Please detailed in french  ${language}:
     ${prompt} :\n
    ${unstructuredText}
    `;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const result = await model.generateContent([promptText]);
    // console.log( result.response.text());
    return result.response.text();
}
module.exports = { structureText };
