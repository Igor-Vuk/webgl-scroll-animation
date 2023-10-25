import * as THREE from "three"
import GUI from "lil-gui"
import gsap from "gsap"

THREE.ColorManagement.enabled = false

const gui = new GUI()

/* Parameters */
const parameters = {
  materialColor: "#ffeded",
  directionalLightColor: "#ffffff",
  directionalLightIntensity: 1,
}

// Canvas
const canvas = document.querySelector("canvas.webgl")

// Scene

const scene = new THREE.Scene()

const axisHelper = new THREE.AxesHelper(3.5)
scene.add(axisHelper)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}
/* -------------------------------------------------Texture-------------------------------------------------------*/
const textureLoader = new THREE.TextureLoader()
const gradientTexture = textureLoader.load("/textures/gradients/3.jpg")
gradientTexture.magFilter = THREE.NearestFilter

/* ------------------------------------------------Material------------------------------------------------------ */
const objectsDistance = 4
const material = new THREE.MeshToonMaterial({
  color: parameters.materialColor,
  gradientMap: gradientTexture,
})

/* -------------------------------------------------Mesh-------------------------------------------------------- */
const mesh1 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), material)
const mesh2 = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 32), material)
const mesh3 = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
  material
)

mesh1.position.y = -objectsDistance * 0
mesh2.position.y = -objectsDistance * 1
mesh3.position.y = -objectsDistance * 2

mesh1.position.x = 2
mesh2.position.x = -2
mesh3.position.x = 2

scene.add(mesh1, mesh2, mesh3)

const sectionMeshes = [mesh1, mesh2, mesh3]

/* --------------------------------------------------Particles------------------------------------------------------ */

const count = 200
const positionsArray = new Float32Array(count * 3)

for (let i = 0; i < count * 3; i++) {
  positionsArray[i * 3 + 0] = (Math.random() - 0.5) * 10
  positionsArray[i * 3 + 1] =
    objectsDistance / 2 - Math.random() * objectsDistance * sectionMeshes.length // since there is 4 units space between objects we know that there is only 2 above object. Also we multiply by number of objects we have.
  positionsArray[i * 3 + 2] = (Math.random() - 0.5) * 10
}

const particlesGeometry = new THREE.BufferGeometry()
particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionsArray, 3)
)

const particlesMaterial = new THREE.PointsMaterial({
  size: 0.03,
  color: parameters.materialColor,
  sizeAttenuation: true,
})

particlesMaterial.blending = THREE.AdditiveBlending

const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)
/* --------------------------------------------------Light------------------------------------------------------ */
const directionalLight = new THREE.DirectionalLight(
  parameters.directionalLightColor,
  parameters.directionalLightIntensity
)
directionalLight.position.set(1, 1, 0)

scene.add(directionalLight)

/* ------------------------------------------------- GUI -------------------------------------------------------*/
gui.addColor(material, "color").name("material color")
gui.addColor(particlesMaterial, "color").name("particles color")
gui.addColor(directionalLight, "color").name("directional_light-color")

gui
  .add(directionalLight, "intensity")
  .min(0)
  .max(10)
  .step(0.1)
  .name("directional_light-intensity")
/* ------------------------------------------------------------------------------------------------------------*/

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
/* We add camera to camera group because we want to move camera group and not camera itself.  
 Because of parallax effect, in the "tick" function we move the whole cameraGroup when moving the mouse
 but when we scroll down we only move camera in the group. */
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
)
camera.position.z = 6
cameraGroup.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true, // we can use this to see through canvas what is behind. This way we can change background directly in css
})
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/* ---------------------------------------------------Scroll-----------------------------------------------*/
/* We do this in case it takes longer for javascript to load and user has already scrolled */
let scrollY = window.scrollY
/* Make animation of object when we scroll to it */
let currentSection = 0

window.addEventListener("scroll", () => {
  scrollY = window.scrollY
  // by doing this each section will be represented by number, 0, 1, 2
  const newSection = Math.round(scrollY / sizes.height)

  if (newSection !== currentSection) {
    currentSection = newSection

    gsap.to(sectionMeshes[currentSection].rotation, {
      duration: 1.5,
      ease: "power2.inOut",
      x: "+=6",
      y: "+=3",
      z: "+=1.5",
    })
  }
})

/* ---------------------------------------------------Cursor-----------------------------------------------*/
const cursor = {
  x: 0,
  y: 0,
}

window.addEventListener("mousemove", () => {
  /* We divide position of the cursor by the width and height of window which gives us values between 0 and 1 
  and subtract 0.5 si values go from -0.5 to 0.5*/
  cursor.x = event.clientX / sizes.width - 0.5
  cursor.y = event.clientY / sizes.height - 0.5
})

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime

  // Animate camera
  /**
   * * The scrollY variable stores the current vertical scroll position of the user. The sizes.height variable stores the height of the window.
   * * The formula calculates the position of the camera on the y-axis by dividing the current scroll position by the height of the window and
   * * then multiplying it by the objectsDistance variable. The objectsDistance variable is a constant that determines the distance between the
   * * meshes in the scene. We need to use minus in front of scrollY because when we scroll down camera is moving on -y axis.
   * * By using this formula, the camera moves up and down as the user scrolls, creating a parallax effect and giving the illusion of depth in
   * * the scene
   */

  camera.position.y = (-scrollY / sizes.height) * objectsDistance

  const parallaxX = cursor.x / 2 // divide by 2 to reduce effect of parallax
  const parallaxY = -cursor.y / 2

  // cameraGroup.position.x = parallaxX
  // cameraGroup.position.y = parallaxY

  /* deltaTime is used to ensure that the movement of the cameraGroup is smooth and consistent, regardless of the monitor frame rate */
  cameraGroup.position.x +=
    (parallaxX - cameraGroup.position.x) * 10 * deltaTime
  cameraGroup.position.y +=
    (parallaxY - cameraGroup.position.y) * 10 * deltaTime

  // Animate meshes
  sectionMeshes.forEach((mesh) => {
    /* We can change rotation like this */

    // mesh.rotation.x = elapsedTime * 0.1
    // mesh.rotation.y = elapsedTime * 0.12

    /* or we can change it like this. Difference is that above we are "assigning" new value on every frame. In example below we are 
    "adding" to the value. By doing this we can add to this value what we get from gsap animation while scrolling  */
    mesh.rotation.x += deltaTime * 0.1
    mesh.rotation.y += deltaTime * 0.12
  })

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
