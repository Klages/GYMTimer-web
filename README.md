# GYM Timer (Web Clap Timer)

A simple, responsive web-based timer designed for workouts. It uses your device's microphone to listen for claps, allowing you to start and reset the timer without having to touch your phone or computer.

## Features

- **Hands-Free Control:** Starts and resets the timer using audio detection (a sharp noise like a clap).
- **Adjustable Sensitivity:** Fine-tune the microphone threshold to avoid false triggers in noisy environments.
- **Visual Feedback:** The timer and buttons flash upon detecting a clap or when setting the threshold.
- **Live Volume Monitoring:** Displays the maximum and live volume levels to help you calibrate the detection threshold.
- **Fully Local & Private:** Runs entirely in your browser using the Web Audio API. No audio data is recorded or sent to any server.
- **Responsive Design:** Optimized for both mobile and desktop screens with a clean, dark-mode aesthetic.

## How to Use

1. **Open the App:** Simply open `gymtimer.html` in any modern web browser. You don't need a local server to run this.
2. **Start Listening:** Click the "Start Listening" button and grant the browser permission to access your microphone.
3. **Calibrate (Optional):** Make a test clap and observe the `Max Vol` reading. Adjust the `Threshold` value so it is slightly below your clap's volume but above the background noise level. Click "Set" to apply the new threshold.
4. **Use the Timer:** 
   - A **double clap** (two claps within 0.6 seconds) will **start** or **reset** the timer.

## Technologies Used

This project is built using standard web technologies with zero external dependencies:
- **HTML5:** For the structure.
- **CSS3:** For styling, layout, and responsive design (using Flexbox and `clamp()` for dynamic font scaling).
- **Vanilla JavaScript:** For the application logic, DOM manipulation, and microphone input processing using the Web Audio API.

## Running Locally

Because this project relies entirely on client-side technologies, no build step or package manager is required. 

To run it:
1. Clone or download this repository.
2. Open the `gymtimer.html` file directly in your web browser. 

*Note: For the microphone access to work properly, some browsers may require the file to be served over `localhost` or `https` (e.g., using a simple local server like Python's `http.server` or VS Code's Live Server extension).*

## License

This project is open-source and available for anyone to use and modify.
