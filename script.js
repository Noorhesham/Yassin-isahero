window.addEventListener("load", () => {
  const lenis = new Lenis();
  //adding the smooth scroll
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  //loading images in the slider
  const images = [];
  let loadedImageCount = 0;
  const IMAGENUMBER = 7;
  function loadImages() {
    for (let i = 1; i <= IMAGENUMBER; i++) {
      const img = new Image();
      img.onload = function () {
        //when the image is loaded we will push it to the images array and increase the counter  and when all of them loads
        //we will init the scene
        images.push(img);
        loadedImageCount++;

        if (loadedImageCount === 7) {
          initializeScene();
        }
      };
      img.onerror = function () {
        loadedImageCount++;
        if (loadedImageCount === 7) {
          initializeScene();
        }
      };
      img.src = `./assets/img${i}.jpg`;
    }
  }

  function initializeScene() {
    //creating new 3 js scene
    const scene = new THREE.Scene();
    //prespctive camera because we want to see the 3d effect
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector("canvas"),
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000); // bg for renderer

    const parentWidth = 20;
    const parentHeight = 75;
    const curvature = 35;
    const segmentsX = 300;
    const segmentsY = 300;

    const parentGeometry = new THREE.PlaneGeometry(parentWidth, parentHeight, segmentsX, segmentsY);
    //this positions we are getting from the geomerty after creating  it which was crated automatically
    //كل 3 قيم بتمثل نقطة (Vertex): x, y, z.

    const positions = parentGeometry.attributes.position.array;
    console.log(positions);
    //for each
    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1]; //get the y of each vertex
      const distanceFromCenter = Math.abs(y / (parentHeight / 2.4)); // calculate the distance from the center of the parent and the vertex
      positions[i + 2] = Math.pow(distanceFromCenter, 2) * curvature; //add this distance to the z axis of the vertex
    }
    parentGeometry.computeVertexNormals();

    const totalSlides = 7;
    const slideHeight = 15;
    const gap = 0.5;
    const cycleHeight = totalSlides * (slideHeight + gap);

    const textureCanvas = document.createElement("canvas");
    const ctx = textureCanvas.getContext("2d", {
      alpha: false,
      willReadFrequently: false,
    });
    textureCanvas.width = 2048;
    textureCanvas.height = 8192;

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

    const parentMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    const parentMesh = new THREE.Mesh(parentGeometry, parentMaterial);
    parentMesh.position.set(0, 0, 0);
    parentMesh.rotation.x = THREE.MathUtils.degToRad(-20);
    parentMesh.rotation.y = THREE.MathUtils.degToRad(20);
    scene.add(parentMesh);

    const distance = 17.5;
    const heightOffset = 5;
    const offsetX = distance * Math.sin(THREE.MathUtils.degToRad(20));
    const offsetZ = distance * Math.cos(THREE.MathUtils.degToRad(20));

    camera.position.set(offsetX, heightOffset, offsetZ);
    camera.lookAt(0, -2, 0);
    camera.rotation.z = THREE.MathUtils.degToRad(-5);

    const slideTitles = [
      "The Silent Cry",
      "Bravery in Shadows",
      "Spider-Yassin",
      "The Boy Who Spoke",
      "Hero in Court",
      "Fearless Heart",
      "Justice for Yassin",
    ];

    function updateTexture(offset = 0) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
      //defining the main styles for the canvas
      const fontSize = 180;
      ctx.font = `500 ${fontSize}px Dahlia`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const extraSlides = 2;
      //looping through the slides to draw them on the canvas
      for (let i = -extraSlides; i < totalSlides + extraSlides; i++) {
        let slideY = -i * (slideHeight + gap);
        //make sure the canvas texutre fall back if it exceeds the height of the mesh
        slideY += offset * cycleHeight;

        const textureY = (slideY / cycleHeight) * textureCanvas.height;
        let wrappedY = textureY % textureCanvas.height;
        if (wrappedY < 0) wrappedY += textureCanvas.height;

        let slideIndex = ((-i % totalSlides) + totalSlides) % totalSlides;
        let slideNumber = slideIndex + 1;

        const slideRect = {
          x: textureCanvas.width * 0.05,
          y: wrappedY,
          width: textureCanvas.width * 0.9,
          height: (slideHeight / cycleHeight) * textureCanvas.height,
        };

        const img = images[slideNumber - 1];
        if (img) {
          // 1. نحسب نسبة عرض الصورة إلى ارتفاعها
          const imgAspect = img.width / img.height;
          // 2. ونحسب نفس النسبة للمستطيل (الشريحة)
          const rectAspect = slideRect.width / slideRect.height;

          let drawWidth, drawHeight, drawX, drawY;
          // 3. نقرر إزاي نكبر الصورة عشان تغطي المستطيل بالكامل

          if (imgAspect > rectAspect) {
            drawHeight = slideRect.height;
            drawWidth = drawHeight * imgAspect;
            drawX = slideRect.x + (slideRect.width - drawWidth) / 2;
            drawY = slideRect.y;
          } else {
            drawWidth = slideRect.width;
            drawHeight = drawWidth / imgAspect;
            drawX = slideRect.x;
            drawY = slideRect.y + (slideRect.height - drawHeight) / 2;
          }

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(slideRect.x, slideRect.y, slideRect.width, slideRect.height);
          ctx.clip();
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();

          ctx.fillStyle = "white";
          ctx.fillText(slideTitles[slideIndex], textureCanvas.width / 2, wrappedY + slideRect.height / 2);
        }
      }

      texture.needsUpdate = true;
    }
    let currentScroll = 0;
    lenis.on("scroll", ({ scroll, limit, velocity, direction, progress }) => {
      currentScroll = scroll / limit;
      updateTexture(-currentScroll * 1);
      renderer.render(scene, camera);
    });

    let resizeTimeout;
    window.addEventListener("resize", () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }, 250);
    });

    updateTexture(0);
    renderer.render(scene, camera);
  }

  loadImages();
});
