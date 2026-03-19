# Attendance Recovery Planner

The Attendance Recovery Planner is a browser-based tool that helps students track their class attendance and figure out how many classes they need to attend to meet their goals. 

It calculates your current standing, tells you if you have room to miss a class, and projects your final attendance based on the remaining days in the semester.

## Features

* **Progress Tracking:** View your current attendance percentage for all your subjects in one place.
* **Safe Skips:** See exactly how many upcoming classes you can miss without dropping below your target percentage.
* **Recovery Load:** If you are below your target, the app tells you exactly how many consecutive classes you need to attend to recover.
* **Visual Projections:** Click on any subject to see a timeline of future classes and toggle them to see how missing a specific day affects your final percentage.
* **Bulk Import:** Paste text directly from your student portal to automatically add all your subjects and current attendance numbers.
* **Custom Targets:** Set your own attendance goals or toggle the health certificate option to automatically adjust the requirement.

## Setup and Usage

This application runs entirely in your web browser. There is no server setup or installation required.

1.  Download or clone the repository to your computer.
2.  Open the `index.html` file in any modern web browser.
3.  Add subjects manually using the add button, or use the import tool to paste your data.

## How the Calculations Work

The app uses your current data and the semester schedule to calculate your status. It relies on four main numbers:

* **Present:** Classes you have attended.
* **Total:** Classes that have happened so far.
* **Future:** Classes remaining in the semester.
* **Target:** The percentage you need to maintain.

Based on these numbers, the app determines:

* **Current Average:** (Present / Total) * 100
* **Optimistic Max:** The highest possible percentage you can reach if you attend every single remaining class. If this number is lower than your target, the goal is unachievable.
* **Buffer (Bunk Budget):** How many classes you can skip right now before your current average falls below the target.
* **Needed (Recovery Load):** How many classes in a row you must attend to bring your current average back up to the target.
* **Total Safe Skips:** How many total classes you can afford to miss over the rest of the semester and still finish exactly at your target.

## Configuration

The application uses a `config.json` file to understand the semester timeline. You can edit this file to match your academic calendar:

* `semEndDate`: The final date of classes for the semester.
* `holidays`: A list of dates when classes will not be held.
* `departments`: The weekly class schedule for different departments, mapping subject codes to the number of times they meet on a given day.
