const counts = 0;
const video = document.getElementById("video");
const isScreenSmall = window.matchMedia("(max-width: 700px)");
let predictedAges = [];

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/mind_read/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/mind_read/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/mind_read/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/mind_read/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/mind_read/models")
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => (video.srcObject = stream),
    err => console.error(err)
  );
}
function screenResize(isScreenSmall) {
  if (isScreenSmall.matches) {
    // If media query matches
    video.style.width = "320px";
  } else {
    video.style.width = "500px";
  }
}

screenResize(isScreenSmall); // Call listener function at run time
isScreenSmall.addListener(screenResize);

video.addEventListener("playing", () => {
  console.log("playing called");
  const canvas = faceapi.createCanvasFromMedia(video);
  let container = document.querySelector(".container");
  container.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    console.log(resizedDetections);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    if (resizedDetections && Object.keys(resizedDetections).length > 0) {
      const age = resizedDetections.age;
      const interpolatedAge = interpolateAgePredictions(age);
      const gender = resizedDetections.gender;
      const expressions = resizedDetections.expressions;
      const maxValue = Math.max(...Object.values(expressions));
      const emotion = Object.keys(expressions).filter(
        item => expressions[item] === maxValue
      );
      document.getElementById("age").innerText = `Age - ${interpolatedAge}`;
      document.getElementById("gender").innerText = `Gender - ${gender}`;
      document.getElementById("emotion").innerText = `Emotion - ${emotion[0]}`;
      // Set up OpenAI API
      const encodedString = "c2std3lKMnZKdWN4VjhLTDRzUnRNTkJUM0JsYmtGSklrUFR3eWZkRkZZQXZsT2QwM3pj";
const decodedString = atob(encodedString);
const openaiApiKey = decodedString;
const openaiUrl = 'https://api.openai.com/v1/engines/davinci-codex/completions';

// Inside the `onPlay` function, after detecting the face expression
if (resizedDetections && Object.keys(resizedDetections).length > 0 && counts < 1) {
  let prompt = '';

  if (expressions.happy > 0.5) {
    prompt = 'Write an educational story.';
  } else if (expressions.sad > 0.5) {
    prompt = 'Write a happy story.';
  } else {
    prompt = 'Write a scientific story.';
  }
  counts = 1;
  // Call OpenAI API to generate story text
  const data = {
    prompt,
    max_tokens: 100,
    n: 1,
    stop: '.',
  };

  fetch(openaiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify(data),
  })
  .then((response) => response.json())
  .then((data) => {
    const story = data.choices[0].text;
    document.getElementById('story-container').innerHTML = story;
  })
  .catch((error) => console.log(error));
}

    }
  }, 10);
});

function interpolateAgePredictions(age) {
  predictedAges = [age].concat(predictedAges).slice(0, 30);
  const avgPredictedAge =
    predictedAges.reduce((total, a) => total + a) / predictedAges.length;
  return avgPredictedAge;
}


