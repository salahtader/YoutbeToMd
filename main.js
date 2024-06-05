const path = require("path");
const fs = require("fs");
const axios = require("axios");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const { structureText } = require("./textStructure");

async function main(videoId, langue, apiKey, GoogleAPIKEY, prompt) {
  const audioDir = path.join(__dirname, "audio");
  const txtDir = path.join(__dirname, "txt");
  const imgDir = path.join(__dirname, "img");

  if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir);
  if (!fs.existsSync(txtDir)) fs.mkdirSync(txtDir);
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

  async function downloadAudio(videoId, outputPath) {
    return new Promise((resolve, reject) => {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      // const audioOutputPath = path.join(outputPath, `${videoId}.mp3`);
      const stream = ytdl(videoUrl, { quality: "highestaudio" });
      const ffmpegProcess = ffmpeg(stream)
        .setFfmpegPath(ffmpegPath)
        .audioBitrate(128)
        .save(outputPath)
        .on("end", () => resolve(outputPath))
        .on("error", reject);
    });
  }

  async function downloadThumbnail(videoId, outputPath) {
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const info = await ytdl.getInfo(videoUrl);
      const thumbnailUrl = info.videoDetails.thumbnails.pop().url;
      const response = await axios.get(thumbnailUrl, {
        responseType: "arraybuffer",
      });
      const thumbnailPath = path.join(outputPath, `${videoId}.jpg`);
      fs.writeFileSync(thumbnailPath, response.data);
      return thumbnailPath;
    } catch (error) {
      console.error("Error downloading thumbnail:", error);
    }
  }

  async function uploadAudio(filePath, apiKey) {
    try {
      const audioData = fs.readFileSync(filePath);
      const response = await axios.post(
        "https://api.assemblyai.com/v2/upload",
        audioData,
        {
          headers: {
            authorization: apiKey,
            "content-type": "application/octet-stream",
          },
        }
      );
      return response.data.upload_url;
    } catch (error) {
      console.error("Error uploading audio:", error);
    }
  }

  async function transcribeAudio(audioUrl, apiKey) {
    try {
      const response = await axios.post(
        "https://api.assemblyai.com/v2/transcript",
        {
          audio_url: audioUrl,
          iab_categories: true,
          auto_chapters: true,
          auto_highlights: true,
          language_detection: true,
          speaker_labels: true,
        },
        {
          headers: { authorization: apiKey },
        }
      );
      return response.data.id;
    } catch (error) {
      console.error("Error requesting transcription:", error);
    }
  }

  async function getTranscriptionResult(transcriptionId, apiKey) {
    try {
      while (true) {
        const response = await axios.get(
          `https://api.assemblyai.com/v2/transcript/${transcriptionId}`,
          {
            headers: {
              authorization: apiKey,
              "content-type": "application/json",
            },
          }
        );
        const status = response.data.status;
        if (status === "completed") {
          return response.data.text;
        } else if (status === "failed") {
          console.error("Transcription failed:", response.data);
          return null;
        }
        await new Promise((res) => setTimeout(res, 5000));
      }
    } catch (error) {
      console.error("Error getting transcription result:", error);
    }
  }

  async function getYouTubeVideoInfo(videoId) {
    try {
      const url = `https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await axios.get(url);
      return Object.entries(response.data).map(([key, value]) => ({
        key,
        value,
      }));
    } catch (error) {
      console.error("Error:", error);
    }
  }

  const saveTranscription = (text, videoInfo, outputPath) => {
    try {
      let content = `Informations de la vidéo:\n`;
      for (const info of videoInfo) {
        content += `${info.key}: ${info.value}\n`;
      }
      content += "\nTranscription:\n";
      content += text;
      fs.writeFileSync(outputPath, content);
      console.log("Transcription enregistrée avec succès:", outputPath);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la transcription:", error);
    }
  };

  function cleanFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9]/g, "");
  }

  let audioFilePath = "";
  let txtFilePath = "null.txt";
  let structuretxtFilePath = "nullf.txt";

  await getYouTubeVideoInfo(videoId).then((videoInfoArray) => {
    const cleanedFileName = cleanFileName(videoInfoArray[0].value);
    txtFilePath = path.join(txtDir, cleanedFileName + "brut.txt");
    structuretxtFilePath = path.join(txtDir, cleanedFileName + "formate.md");
    audioFilePath = path.join(audioDir, `${cleanedFileName}.mp3`);
  });

  try {
    console.log("Downloading audio...");
    await downloadAudio(videoId, audioFilePath);
    console.log("Audio downloaded.");

    console.log("Downloading thumbnail...");
    await downloadThumbnail(videoId, imgDir);
    console.log("Thumbnail downloaded.");

    console.log("Uploading audio to AssemblyAI...");
    const audioUrl = await uploadAudio(audioFilePath, apiKey);
    console.log("Audio uploaded.");

    console.log("Requesting transcription...");
    const transcriptionId = await transcribeAudio(audioUrl, apiKey);
    console.log("Transcription requested.");

    console.log("Getting transcription result...");
    const transcriptionText = await getTranscriptionResult(transcriptionId, apiKey);
    if (transcriptionText) {
      getYouTubeVideoInfo(videoId).then(async (videoInfoArray) => {
        if (videoInfoArray) {
          saveTranscription(transcriptionText, videoInfoArray, txtFilePath);

          try {
            const structuredText = await structureText(
              transcriptionText,
              langue,
              GoogleAPIKEY,
              prompt
            );
            console.log("Generating structured text...");
            if (structuredText) {
              saveTranscription(structuredText, videoInfoArray, structuretxtFilePath);
            }
            console.log("Files ready for download.");
          } catch (error) {
            console.error("Error structuring text:", error);
          }
        }
      });
    }
  } catch (error) {
    console.error("Error in the process:", error);
  }
}

// Example usage
const formData = {
  videoId: "your_video_id",
  langue: "en",
  apiKey: "your_assemblyai_api_key",
  GoogleAPIKEY: "your_google_api_key",
  prompt: "your_prompt",
};

main(formData.videoId, formData.langue, formData.apiKey, formData.GoogleAPIKEY, formData.prompt);
