// Fetch files.csv and parse into {title, before, after} objects
(async () => {
  const $$ = (id) => document.getElementById(id);

  async function fetchFiles() {
    return await fetch("files.csv")
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split("\n");
        return lines.map((line) => {
          const [title, before, after] = line.split(/\s*,\s*/);
          return { title, before, after };
        });
      });
  }

  const files = await fetchFiles();

  const $audioItem = document.getElementById("audio-list-item");
  const $audioList = document.getElementById("audio-list");
  const $audioItems = [];
  function renderAudioFiles() {
    files.forEach((file, i) => {
      const $newAudioItem = $audioItem.content.cloneNode(true);
      $newAudioItemRoot = $newAudioItem.firstElementChild;
      $newAudioItem.querySelector(".audio-item-title").innerText = file.title;
      // $newAudioItem.querySelector(".audio-item-play");
      console.log($newAudioItem);
      $newAudioItemRoot.addEventListener("click", () => {
        loadFile(i, true);
      });
      $audioList.appendChild($newAudioItem);
      $audioItems.push($newAudioItemRoot);
    });
  }
  renderAudioFiles();

  const $waveform = $$("waveform");
  const $prevButton = $$("prev-button");
  const $playButton = $$("play-button");
  const $playIcon = $$("play-icon");
  const $pauseIcon = $$("pause-icon");
  const $nextButton = $$("next-button");
  const $timeCurrent = $$("time-current");
  const $timeTotal = $$("time-total");
  const $beforeAfterToggle = $$("before-after-toggle");

  $beforeAfterToggle.addEventListener("change", setCurrentPlayfile);
  $playButton.addEventListener("click", playPauseFile);
  $nextButton.addEventListener("click", () => {
    loadFile(fileIndex + 1, true);
  });
  $prevButton.addEventListener("click", () => {
    loadFile(fileIndex - 1, true);
  });

  let before = null;
  let after = null;
  let current = null;
  let fileIndex = 0;

  loadFile(0);

  setInterval(() => {
    if (current && !current.paused) {
      $timeCurrent.innerText = formatDuration(current.currentTime);
    }
  }, 100);

  function loadFile(index, play) {
    if (index < 0) {
      index = files.length - 1;
    } else if (index >= files.length) {
      index = 0;
    }

    if ($audioItems[fileIndex]) {
      $audioItems[fileIndex].classList.remove("playing");
    }
    $audioItems[index].classList.add("playing");

    fileIndex = index;
    if (before) {
      before.pause();
      before.src = "";
    }
    if (after) {
      after.pause();
      after.src = "";
    }
    before = new Audio(files[index].before);
    after = new Audio(files[index].after);
    setCurrentPlayfile();
    if (play) {
      current.play();
      setPlayIcon();
    }
  }

  function setCurrentPlayfile() {
    const prev = current;
    if ($beforeAfterToggle.checked) {
      current = after;
    } else {
      current = before;
    }

    if (prev && prev !== current) {
      current.currentTime = prev.currentTime;
      if (!prev.paused) {
        prev.pause();
        current.play();
      }
    }

    // renderWaveform(current);
    setTotalTime();
  }

  function setTotalTime() {
    current.addEventListener("loadedmetadata", () => {
      $timeTotal.innerText = formatDuration(current.duration);
    });
  }

  function playPauseFile(forcePlay) {
    if (current.paused) {
      current.play();
    } else {
      current.pause();
    }
    setPlayIcon();
  }

  function setPlayIcon() {
    if (current.paused) {
      $playIcon.style.display = "block";
      $pauseIcon.style.display = "none";
    } else {
      $playIcon.style.display = "none";
      $pauseIcon.style.display = "block";
    }
  }

  function formatDuration(duration) {
    let minutes = Math.floor(duration / 60);
    let seconds = Math.floor(duration % 60);
    let formattedDuration =
      (minutes < 10 ? "0" : "") +
      minutes +
      ":" +
      (seconds < 10 ? "0" : "") +
      seconds;
    return formattedDuration;
  }

  // function renderWaveform(audioObject) {
  //   let audioContext = new AudioContext();

  //   // load the audio file and decode it into a buffer
  //   let fileReader = new FileReader();
  //   fileReader.onload = function () {
  //     audioContext.decodeAudioData(fileReader.result, function (buffer) {
  //       // create an AnalyserNode to get frequency and time-domain data
  //       let analyser = audioContext.createAnalyser();
  //       analyser.fftSize = 2048;

  //       // connect the buffer to the analyser
  //       let audioBufferSource = audioContext.createBufferSource();
  //       audioBufferSource.buffer = buffer;
  //       audioBufferSource.connect(analyser);
  //       audioBufferSource.start(0);

  //       // render the waveform using a canvas element
  //       let canvasContext = $waveform.getContext("2d");
  //       let canvasWidth = $waveform.width;
  //       let canvasHeight = $waveform.height;
  //       let bufferLength = analyser.frequencyBinCount;
  //       let dataArray = new Uint8Array(bufferLength);
  //       let pixelSpacing = 1;
  //       let scale = canvasHeight / 2;

  //       canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
  //       canvasContext.beginPath();
  //       canvasContext.strokeStyle = "rgba(0, 0, 0, 0.5)";
  //       canvasContext.lineWidth = 1;

  //       function renderFrame() {
  //         // get the time-domain data and calculate the waveform
  //         analyser.getByteTimeDomainData(dataArray);

  //         for (let i = 0; i < canvasWidth; i++) {
  //           let sampleIndex = Math.floor((i * bufferLength) / canvasWidth);
  //           let sampleValue = dataArray[sampleIndex] / 128 - 1;
  //           let x = i * pixelSpacing;
  //           let y = (1 + sampleValue) * scale;

  //           if (i === 0) {
  //             canvasContext.moveTo(x, y);
  //           } else {
  //             canvasContext.lineTo(x, y);
  //           }
  //         }

  //         canvasContext.stroke();
  //       }

  //       // start rendering the waveform
  //       renderFrame();
  //     });
  //   };

  //   let xhr = new XMLHttpRequest();
  //   xhr.open("GET", audioObject.src, true);
  //   xhr.responseType = "blob";
  //   xhr.onload = function () {
  //     if (this.status === 200) {
  //       // create a blob URL from the blob response
  //       let blobUrl = URL.createObjectURL(this.response);
  //       fileReader.readAsArrayBuffer(blobUrl);
  //     }
  //   };
  //   xhr.send();
  // }
})();
