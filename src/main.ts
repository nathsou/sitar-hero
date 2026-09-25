import './styles.css';
import { Renderer } from './render/renderer';
import { App } from './ui/app';

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const renderer = new Renderer(canvas);
new App(canvas, renderer);

const loop = () => {
  // Schedule first, so one failed frame cannot stop the loop.
  requestAnimationFrame(loop);
  renderer.frame();
};
requestAnimationFrame(loop);
