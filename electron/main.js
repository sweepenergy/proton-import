const electron = require('electron');
const url = require('url');
const path = require('path');
const { createPublicKey } = require('crypto');

const {app, BrowserWindow, Menu, ipcMain} = electron;

let mainWindow;
let addWindow;

// Listen for the app to be ready
app.on('ready', function(){
    //Create new window
    mainWindow = new BrowserWindow({
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    //Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file',
        slashes: true
    }));
    // Quit app when closed
    mainWindow.on('closed', function(){
        app.quit();
    });

    // Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //Insert menu
    Menu.setApplicationMenu(mainMenu);
});

// Handle Import Window
function createAddWindow(){
    //Create new window
    addWindow = new BrowserWindow({
        width: 300,
        length: 200,
        title: 'Import Your Data',
        webPreferences:{
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    //Load html into window
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol: 'file',
        slashes: true
    }));

    // Garbage collection handle
    addWindow.on('close', function(){
        addWindow = null;
    });
}

// Catch data:import
ipcMain.on('data:import', function(e, data){
    mainWindow.webContents.send('data:import', data);
    addWindow.close();
});

// Create menu template
const mainMenuTemplate = [
    {
        label: 'File', 
        submenu:[
            {
                label: 'Import Data',
                click(){
                    createAddWindow();
                }
            },
            {
                label: 'View Data'
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            }
        ]
    }
];

// If Mac, add empty object to menu
if(process.platofrom == 'darwin'){
    mainMenuTemplate.unshift({});
}

// Add dev tools item if not in prodcution

if(process.env.NODE_ENV !== 'production'){
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu:[
            {
                label: 'Toggle Developer Tools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}