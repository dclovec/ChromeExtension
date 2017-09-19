//通用函数、常量
function getStore(name) {
    return new Promise(function (resolve) {
        chrome.storage.local.get(name, function (result) {
            resolve((!!result && result[name]) || null);
        });
    });
}
function setStore(name, value, isCoverDirectly = true) {
    if (!isCoverDirectly) {
        return getStore(name).then(function (result) {
            return new Promise(function (resolve) {
                (!result || result.hasOwnProperty(name)) ? chrome.storage.local.set({ [name]: value }, () => resolve()) : resolve('exist');
            });
        });
    } else {
        return new Promise(function (resolve) {
            chrome.storage.local.set({ [name]: value }, function () {
                resolve();
            });
        });
    }
}
function removeStore(name) {
    return new Promise(function (resolve) {
        chrome.storage.local.remove(name, function () {
            resolve();
        });
    });
}




//业务通用逻辑
const storeKeyName = 'scripts-lg62416gfw4e46we';
function saveScript(pattern, code, isCoverDirectly = true) {
    return getStore(storeKeyName).then(function (scripts) {
        if (!!scripts) {
            const script = scripts[pattern];
            (!isCoverDirectly && !!script) ? script.push(code) : (scripts[pattern] = [code]);
        } else {
            scripts = {
                [pattern]: [code]
            };
        }
        return setStore(storeKeyName, scripts);
    });
}
function removeScript(pattern, index) {
    return getStore(storeKeyName).then(function (scripts) {
        if (!!scripts) {
            if ('number' !== (typeof index)) {
                delete scripts[pattern];
            } else {
                scripts[pattern].splice(index, 1);
            }
        }
        return Promise.resolve();
    });
}
function executeSettedScript() {
    return getStore(storeKeyName).then(function (scripts) {
        // console.log(scripts)
        if (!!scripts) {
            const url = decodeURIComponent(location.href);
            Object.keys(scripts).filter(pattern => (new RegExp(pattern)).test(url)).forEach(function (pattern) {
                executeScriptInPage(scripts[pattern]);
            });
        }
    });
}
function executeScriptInPage(codes) {
    if ('function' === (typeof codes)) {
        codes = codes.toString();
        codes = codes.slice(1 + codes.indexOf('{'));
        codes = [codes.slice(0, codes.lastIndexOf('}'))];
    } else if (!(codes instanceof Array)) {
        codes = [codes];
    }

    const scriptElement = document.createElement('script');
    scriptElement.innerHTML = codes.join(';');
    document.body.appendChild(scriptElement);
}
function sendRuntimeMessage(msg) {
    return new Promise(function (resolve) {
        chrome.runtime.sendMessage(msg, resolve);
    });
}

const events = {
    close(root) {
        root.style.display = 'none';

        let promise;
        if (0 === existScripts.length) {
            promise = removeStore(storeKeyName);
        } else {
            promise = setStore(storeKeyName, existScripts.reduce(function (res, item) {
                const scripts = res[item.name];
                if (!!scripts) {
                    scripts.push(item.code);
                } else {
                    res[item.name] = [item.code];
                }
            }, {}));
        }
        promise.then(function () {
            console.log('success.(Page Scriptor)')
        })
    },
    add(root) {
        existScripts.push({
            name: root.querySelector('.regexp-input').value,
            code: root.querySelector('.code-input').value
        });
        updateExistScripts();
    },
    delete(root, target) {
        const li = target.parentNode,
            index = +li.getAttribute('data-index');
        existScripts.splice(index, 1);
        0 === existScripts.length ? (li.parentNode.innerHTML = '<li class="no-data item">暂无</li>') : li.parentNode.removeChild(li);
    },
};
function clicked(e) {
    const target = e.target;
    if (-1 < target.className.indexOf(' btn')) {
        (events[target.className.split(' ')[0]])(this, target);
    }
}
function valueChanged(e) {
    if (!!e.target.value) {
        !!this.querySelector('.regexp-input').value && !!this.querySelector('.code-input').value && (this.querySelector('.add.btn').disabled = false);
    } else {
        this.querySelector('.add.btn').disabled = true;
    }
}

let root,
    existScripts;
function showAddScriptUI() {
    if (!root) {
        (root = document.createElement('div')).className = storeKeyName;
        // let url = `${location.hostname}`
        root.innerHTML = `
        <div class="box">
            <ol class="exist-list">
            </ol>
            <label>
                <span>输入url正则：</span>
                <input type="text" class="regexp-input" value="\\*://${location.hostname.replace(/\./g, '\\.')}/\\*" />
            </label>
            <label>
                <span>输入执行的代码：</span>
                <textarea class="code-input"></textarea>
            </label>
            <div class="btn-group">
                <button type="button" class="close btn">关闭</button>
                <button type="button" class="add btn">添加</button>
            </div>
        </div>`;
        root.addEventListener('click', clicked);
        root.addEventListener('change', valueChanged);
        document.body.appendChild(root);
    }
    root.style.display = 'block';

    getStore(storeKeyName).then(function (scripts) {
        if (!!scripts) {
            existScripts = Object.keys(scripts).map(function (pattern) {
                return {
                    name: pattern,
                    code: scripts[pattern]
                };
            });
        } else {
            existScripts = [];
        }
        updateExistScripts();
    });
}
function updateExistScripts() {
    root.querySelector('.exist-list').innerHTML = existScripts.map(function (script, index) {
        return `<li class="exist item" data-index="${index}">` + script.name + '<button type="button" class="delete btn">删除</button></li>';
    }).join('') || '<li class="no-data item">暂无</li>';
}





//业务具体逻辑
console.log('page scriptor running...');
executeSettedScript();


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    // console.log('onMessage', message)
    if (!!message) {
        if ('add_script' === message.action) {
            showAddScriptUI();
        }
    }
});

// const value = prompt('please enter your name')
// console.log('enter:',value)


// saveScript('[\\w\\W]*', 'console.log("script executed.", $)').then(function () {
//     executeSettedScript();
// });
// removeScript('*');

// setStore(storeKeyName, {}).then(function () {
//     console.log('setted')
// });