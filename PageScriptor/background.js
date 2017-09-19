

chrome.contextMenus.create({
    type: 'normal',
    title: 'Page Scriptor',
    id: 'add-script',
    onclick: function (info, tab) {
        console.log(arguments)
        chrome.tabs.sendMessage(tab.id, { action: 'add_script' });
    }
});