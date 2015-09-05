/**
 * Getter & setter
 */

function getMainMenu() {
    return document.body.retrieve('mainmenu')
}

function getIsBusy() {
    return document.body.hasClass('busy')
}

function setIsBusy(busy) {
    if (busy) document.body.addClass('busy')
    else document.body.removeClass('busy')
}

function getShowVariations() {
    return $('goban').hasClass('variations')
}

function setShowVariations(show) {
    if (show) $('goban').addClass('variations')
    else $('goban').removeClass('variations')

    setting.set('view.show_variations', show)
    getMainMenu().items[3].submenu.items[2].checked = show
}

function getFuzzyStonePlacement() {
    return $('goban').hasClass('fuzzy')
}

function setFuzzyStonePlacement(fuzzy) {
    if (fuzzy) $('goban').addClass('fuzzy')
    else $('goban').removeClass('fuzzy')

    setting.set('view.fuzzy_stone_placement', fuzzy)
    getMainMenu().items[3].submenu.items[0].checked = fuzzy
}

function getShowCoordinates() {
    return $('goban').hasClass('coordinates')
}

function setShowCoordinates(show) {
    if (show) $('goban').addClass('coordinates')
    else $('goban').removeClass('coordinates')

    setting.set('view.show_coordinates', show)
    getMainMenu().items[3].submenu.items[1].checked = show
}

function getShowSidebar() {
    return document.body.hasClass('sidebar')
}

function setShowSidebar(show) {
    if (getShowSidebar() == show) return
    if (show) document.body.addClass('sidebar')
    else document.body.removeClass('sidebar')

    $('sidebar').setStyle('width', setting.get('view.sidebar_width'))
    $('main').setStyle('right', show ? setting.get('view.sidebar_width') : 0)

    if (show) {
        updateGraph()
        updateSlider()
        updateCommentText();
    } else {
        // Clear game graph
        var s = $('graph').retrieve('sigma')

        if (s) {
            s.graph.clear()
            s.refresh()
        }
    }

    // Resize window
    var win = remote.getCurrentWindow()
    var size = win.getContentSize()

    if (win.isMaximized()) return
    win.setContentSize(size[0] + (show ? 1 : -1) * setting.get('view.sidebar_width'), size[1])

    resizeBoard()
}

function getSidebarArrangement() {
    return new Tuple(
        getShowSidebar() && getCommentHeight() != 100,
        getShowSidebar() && getCommentHeight() != 0
    )
}

function setSidebarArrangement(graph, comment, updateLayout) {
    if (updateLayout == null || updateLayout) updateSidebarLayout()

    if (!graph && !comment) setShowSidebar(false)
    else {
        if (!graph && comment) setCommentHeight(100)
        else if (comment) setCommentHeight(setting.get('view.comments_height'))
        else if (!comment) setCommentHeight(0)
        setShowSidebar(true)
    }

    if (getMainMenu()) {
        getMainMenu().items[3].submenu.items[4].checked = graph
        getMainMenu().items[3].submenu.items[5].checked = comment
    }

    setting.set('view.show_graph', graph)
    setting.set('view.show_comments', comment)
}

function getShowGraph() {
    return getSidebarArrangement()[0]
}

function getShowComment() {
    return getSidebarArrangement()[1]
}

function getSidebarWidth() {
    return $('sidebar').getStyle('width').toInt()
}

function setSidebarWidth(width) {
    $('sidebar').setStyle('width', width)
    $$('.sidebar #main').setStyle('right', width)
}

function getCommentHeight() {
    return $('properties').getSize().y * 100 / $('sidebar').getSize().y
}

function setCommentHeight(height) {
    $('graph').setStyle('height', (100 - height) + '%')
    $('properties').setStyle('height', height + '%')
    getSliderValue().unpack(setSliderValue)
}

function getPlayerName(sign) {
    return $$('#player_' + sign + ' .name')[0].get('text')
}

function setPlayerName(sign, name) {
    if (name.trim() == '') name = sign > 0 ? 'Black' : 'White'
    $$('#player_' + sign + ' .name')[0].set('text', name)
}

function getCaptures() {
    return {
        '-1': $$('#player_-1 .captures')[0].get('text').toInt(),
        '1': $$('#player_1 .captures')[0].get('text').toInt()
    }
}

function setCaptures(captures) {
    $$('#player_-1 .captures')[0].set('text', captures['-1'])
        .setStyle('opacity', captures['-1'] == 0 ? 0 : .7)
    $$('#player_1 .captures')[0].set('text', captures['1'])
        .setStyle('opacity', captures['1'] == 0 ? 0 : .7)
}

function getCurrentPlayer() {
    return $$('.currentplayer')[0].get('src') == '../img/ui/blacktoplay.png' ? 1 : -1
}

function setCurrentPlayer(sign) {
    $$('.currentplayer').set('src', sign > 0 ? '../img/ui/blacktoplay.png' : '../img/ui/whitetoplay.png')
}

function getCommentText() {
    return $$('#properties textarea').get('value')[0]
}

function setCommentText(text) {
    var html = '<p>' + text.trim()
        .split('\n')
        .map(function(s) {
            if (s.trim() == '') return ''

            if (s.trim().split('').every(function(x) {
                return x == '-' || x == '='
            })) return '</p><hr><p>'

            return s.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&rt;')
                .replace(/\b((http|https|ftp|ftps)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]+(\/\S*)?)/g, function(url) {
                    return '<a href="' + url + '">' + url + '</a>'
                })
                .replace(/\b[^\s@]+@[a-zA-Z0-9\-\.]+\.[a-zA-Z]+\b/g, function(email) {
                    return '<a href="mailto:' + email + '">' + email + '</a>'
                })
                .replace(/\b[a-hj-zA-HJ-Z][1-9][0-9]?\b/g, function(coord) {
                    return '<span class="coord">' + coord + '</span>'
                })
        })
        .join('<br>')
        .replace(/<br><br>/g, '</p><p>')
        .replace(/(<br>)*<p>(<br>)*/g, '<p>')
        .replace(/(<br>)*<\/p>(<br>)*/g, '</p>') + '</p>'

    $$('#properties textarea').set('value', text)
    $$('#properties .inner')[0].set('html', html)
        .getElements('a').addEvent('click', function() {
            shell.openExternal(this.href)
            return false
        })

    $$('#properties .coord').addEvent('mouseenter', function() {
        var x = 'abcdefghjklmnopqrstuvwxyz'.indexOf(this.get('text')[0].toLowerCase())
        var y = getBoard().size - this.get('text').substr(1).toInt()
        showIndicator(new Tuple(x, y))
    }).addEvent('mouseleave', function() {
        hideIndicator()
    })

    $$('#properties .gm-scroll-view')[0].scrollTo(0, 0)
    $$('#properties textarea')[0].scrollTo(0, 0)
    $('properties').retrieve('scrollbar').update()
}

function getSliderValue() {
    var value = $$('#sidebar .slider div')[0].getStyle('height').toInt()
    var label = $$('#sidebar .slider span')[0].get('text')

    return new Tuple(value, label)
}

function setSliderValue(value, label) {
    var handle = $$('#sidebar .slider div')[0]
    var labelel = $$('#sidebar .slider span')[0]

    var top = value * $('graph').getSize().y / 100 - labelel.getSize().y / 2
    top = Math.min(Math.max(top, 10), $('graph').getSize().y - 10 - labelel.getSize().y)

    handle.setStyle('height', value + '%')
    labelel.set('text', label).setStyle('top', top)
}

function getFindMode() {
    return document.body.hasClass('find')
}

function setFindMode(pickMode) {
    if (pickMode) {
        closeDrawers()
        document.body.addClass('find')
    } else {
        document.body.removeClass('find')
        hideIndicator()
    }
}

function getEditMode() {
    return document.body.hasClass('edit')
}

function setEditMode(editMode) {
    if (editMode) {
        closeDrawers()
        document.body.addClass('edit')
    } else {
        document.body.removeClass('edit')
    }
}

function getScoringMode() {
    return document.body.hasClass('scoring')
}

function setScoringMode(scoringMode) {
    if (scoringMode) {
        closeDrawers()
        document.body.addClass('scoring')

        var deadstones = getBoard().guessDeadStones()
        deadstones.each(function(v) {
            $$('#goban .pos_' + v[0] + '-' + v[1]).addClass('dead')
        })

        updateAreaMap()
    } else {
        document.body.removeClass('scoring')
        $$('.dead').removeClass('dead')
    }
}

function getIndicatorVertex() {
    return $('indicator').retrieve('vertex')
}

/**
 * Methods
 */

function showMessageBox(message, type, buttons, cancelId) {
    setIsBusy(true)

    if (!type) type = 'info'
    if (!buttons) buttons = ['OK']
    if (isNaN(cancelId)) cancelId = 0

    var result = dialog.showMessageBox(remote.getCurrentWindow(), {
        'type': type,
        'buttons': buttons,
        'title': app.getName(),
        'message': message,
        'cancelId': cancelId,
        'noLink': true
    })

    setIsBusy(false)
    return result
}

function readjustShifts(vertex) {
    var li = $$('#goban .pos_' + vertex[0] + '-' + vertex[1])[0]
    var direction = li.get('class').split(' ').filter(function(x) {
        return x.indexOf('shift_') == 0
    }).map(function(x) {
        return x.replace('shift_', '').toInt()
    })

    if (direction.length == 0) return
    direction = direction[0]

    if (direction == 1 || direction == 5 || direction == 8) {
        // Left
        $$('#goban .pos_' + (vertex[0] - 1) + '-' + vertex[1])
            .removeClass('shift_3').removeClass('shift_7').removeClass('shift_6')
    } else if (direction == 2 || direction == 5 || direction == 6) {
        // Top
        $$('#goban .pos_' + vertex[0] + '-' + (vertex[1] - 1))
            .removeClass('shift_4').removeClass('shift_7').removeClass('shift_8')
    } else if (direction == 3 || direction == 7 || direction == 6) {
        // Right
        $$('#goban .pos_' + (vertex[0] + 1) + '-' + vertex[1])
            .removeClass('shift_1').removeClass('shift_5').removeClass('shift_8')
    } else if (direction == 4 || direction == 7 || direction == 8) {
        // Bottom
        $$('#goban .pos_' + vertex[0] + '-' + (vertex[1] + 1))
            .removeClass('shift_2').removeClass('shift_5').removeClass('shift_6')
    }
}

function updateSidebarLayout() {
    var container = $$('#properties .gm-scroll-view')[0]
    container.fade('hide')

    setTimeout(function() {
        $('graph').retrieve('sigma').renderers[0].resize().render()
        $('properties').retrieve('scrollbar').update()
        container.set('tween', { duration: 200 }).fade('in')
    }, 300)
}

function buildBoard() {
    var board = getBoard()
    var rows = []
    var hoshi = board.getHandicapPlacement(9)

    for (var y = 0; y < board.size; y++) {
        var ol = new Element('ol.row')

        for (var x = 0; x < board.size; x++) {
            var vertex = new Tuple(x, y)
            var li = new Element('li.pos_' + x + '-' + y)
                .store('tuple', vertex)
                .addClass('shift_' + Math.floor(Math.random() * 9))
            var img = new Element('img', { src: '../img/goban/stone_0.png' })

            if (hoshi.some(function(v) { return v.equals(vertex) }))
                li.addClass('hoshi')

            ol.adopt(li.adopt(img)
                .addEvent('mouseup', function() {
                    if (!$('goban').retrieve('mousedown')) return
                    $('goban').store('mousedown', false)
                    vertexClicked(this)
                }.bind(vertex))
                .addEvent('mousedown', function() {
                    $('goban').store('mousedown', true)
                })
                .grab(new Element('div', { class: 'area' }))
            )
        }

        rows.push(ol)
    }

    var alpha = 'ABCDEFGHJKLMNOPQRSTUVWXYZ'
    var coordx = new Element('ol.coordx')
    var coordy = new Element('ol.coordy')

    for (var i = 0; i < board.size; i++) {
        coordx.adopt(new Element('li', { text: alpha[i] }))
        coordy.adopt(new Element('li', { text: board.size - i }))
    }

    var goban = $$('#goban div')[0]
    goban.empty().adopt(rows, coordx, coordy)
    goban.grab(coordx.clone(), 'top').grab(coordy.clone(), 'top')

    resizeBoard()

    // Readjust shifts

    $$('#goban .row li:not(.shift_0)').each(function(li) {
        readjustShifts(li.retrieve('tuple'))
    })
}

function resizeBoard() {
    var board = getBoard()
    if (!board) return

    var width = $('goban').getStyle('width').toInt()
    var height = $('goban').getStyle('height').toInt()
    var min = Math.min(width, height)

    var size = !getShowCoordinates() ? board.size : board.size + 2
    var fieldsize = helper.roundEven(min / size)
    min = fieldsize * size

    $$('#goban > div').setStyle('width', min).setStyle('height', min)
        .setStyle('margin-left', -min / 2).setStyle('margin-top', -min / 2)

    $$('#goban .row, #goban .coordx').setStyle('height', fieldsize).setStyle('line-height', fieldsize)
    $$('#goban .row, #goban .coordx').setStyle('margin-left', getShowCoordinates() ? fieldsize : 0)

    $$('#goban .coordy').setStyle('width', fieldsize).setStyle('top', fieldsize).setStyle('line-height', fieldsize)
    $$('#goban .coordy:last-child').setStyle('left', fieldsize * (board.size + 1))

    $$('#goban li').setStyle('width', fieldsize).setStyle('height', fieldsize)

    getSliderValue().unpack(setSliderValue)
    if (getIndicatorVertex()) showIndicator(getIndicatorVertex())
}

function showIndicator(vertex) {
    vertex.unpack(function(x, y) {
        var li = $$('#goban .pos_' + x + '-' + y)
        if (li.length == 0) return
        li = li[0]

        $('indicator').setStyle('top', li.getPosition().y)
            .setStyle('left', li.getPosition().x)
            .setStyle('height', li.getSize().y)
            .setStyle('width', li.getSize().x)
            .store('vertex', vertex)
    })
}

function hideIndicator() {
    $('indicator').setStyle('top', '')
        .setStyle('left', '')
        .store('vertex', null)
}

function buildMenu() {
    var template = [
        {
            label: '&Game',
            submenu: [
                {
                    label: '&New',
                    accelerator: 'CmdOrCtrl+N',
                    click: function() { newGame(true) }
                },
                {
                    label: '&Load…',
                    accelerator: 'CmdOrCtrl+O',
                    click: function() { loadGame() }
                },
                // { type: 'separator' },
                // {
                //     label: '&Save',
                //     accelerator: 'CmdOrCtrl+S'
                // },
                {
                    label: 'Save &As…',
                    accelerator: 'CmdOrCtrl+S',
                    click: function() { saveGame() }
                },
                { type: 'separator' },
                {
                    label: '&Score',
                    click: function() { setScoringMode(true) }
                },
                {
                    label: '&Info',
                    accelerator: 'CmdOrCtrl+I',
                    click: showGameInfo
                }
            ]
        },
        {
            label: '&Edit',
            submenu: [
                {
                    label: 'Toggle &Edit Mode',
                    accelerator: 'CmdOrCtrl+E',
                    click: function() { setEditMode(!getEditMode()) }
                },
                {
                    label: 'Clear &All Overlays',
                    click: clearAllOverlays
                },
                { type: 'separator' },
                {
                    label: '&Stone Tool',
                    accelerator: 'CmdOrCtrl+1',
                    click: function() { setSelectedTool('stone') }
                },
                {
                    label: '&Cross Tool',
                    accelerator: 'CmdOrCtrl+2',
                    click: function() { setSelectedTool('cross') }
                },
                {
                    label: '&Triangle Tool',
                    accelerator: 'CmdOrCtrl+3',
                    click: function() { setSelectedTool('triangle') }
                },
                {
                    label: 'S&quare Tool',
                    accelerator: 'CmdOrCtrl+4',
                    click: function() { setSelectedTool('square') }
                },
                {
                    label: 'C&ircle Tool',
                    accelerator: 'CmdOrCtrl+5',
                    click: function() { setSelectedTool('circle') }
                },
                {
                    label: '&Label Tool',
                    accelerator: 'CmdOrCtrl+6',
                    click: function() { setSelectedTool('label') }
                },
                {
                    label: '&Number Tool',
                    accelerator: 'CmdOrCtrl+7',
                    click: function() { setSelectedTool('number') }
                },
                { type: 'separator' },
                {
                    label: '&Remove Node',
                    accelerator: 'CmdOrCtrl+Delete',
                    click: function() { getCurrentTreePosition().unpack(removeNode) }
                }
            ]
        },
        {
            label: '&Navigation',
            submenu: [
                {
                    label: '&Back',
                    accelerator: 'Up',
                    click: goBack
                },
                {
                    label: '&Forward',
                    accelerator: 'Down',
                    click: goForward
                },
                { type: 'separator' },
                {
                    label: 'Go To &Previous Fork',
                    accelerator: 'CmdOrCtrl+Up',
                    click: goToPreviousFork
                },
                {
                    label: 'Go To &Next Fork',
                    accelerator: 'CmdOrCtrl+Down',
                    click: goToNextFork
                },
                { type: 'separator' },
                {
                    label: 'Go To Be&ginning',
                    accelerator: 'CmdOrCtrl+Home',
                    click: goToBeginning
                },
                {
                    label: 'Go To &End',
                    accelerator: 'CmdOrCtrl+End',
                    click: goToEnd
                },
                { type: 'separator' },
                {
                    label: 'Go To Next Va&riation',
                    accelerator: 'Right',
                    click: goToNextVariation
                },
                {
                    label: 'Go To Previous &Variation',
                    accelerator: 'Left',
                    click: goToPreviousVariation
                },
                { type: 'separator' },
                {
                    label: 'Find &Move',
                    accelerator: 'CmdOrCtrl+F',
                    click: function() { setFindMode(true) }
                }
            ]
        },
        {
            label: '&View',
            submenu: [
                {
                    label: '&Fuzzy Stone Placement',
                    type: 'checkbox',
                    checked: getFuzzyStonePlacement(),
                    click: function() { setFuzzyStonePlacement(!getFuzzyStonePlacement()) }
                },
                {
                    label: '&Coordinates',
                    type: 'checkbox',
                    checked: getShowCoordinates(),
                    click: function() {
                        setShowCoordinates(!getShowCoordinates())
                        resizeBoard()
                    }
                },
                {
                    label: '&Variations',
                    type: 'checkbox',
                    checked: getShowVariations(),
                    click: function() { setShowVariations(!getShowVariations()) }
                },
                { type: 'separator' },
                {
                    label: 'Game &Graph',
                    accelerator: 'CmdOrCtrl+G',
                    type: 'checkbox',
                    checked: getShowGraph(),
                    click: function() { setSidebarArrangement(!getShowGraph(), getShowComment()) }
                },
                {
                    label: 'Co&mments',
                    accelerator: 'CmdOrCtrl+H',
                    type: 'checkbox',
                    checked: getShowComment(),
                    click: function() { setSidebarArrangement(getShowGraph(), !getShowComment()) }
                },
                { type: 'separator' },
                {
                    label: '&Fullscreen',
                    accelerator: 'F11',
                    type: 'checkbox',
                    checked: remote.getCurrentWindow().isFullScreen(),
                    click: function() {
                        var win = remote.getCurrentWindow()
                        win.setFullScreen(!win.isFullScreen())
                        this.checked = win.isFullScreen()
                    }
                }
            ]
        },
        {
            label: '&Help',
            submenu: [
                {
                    label: app.getName() + ' v' + app.getVersion(),
                    enabled: false
                },
                {
                    label: 'Check For &Updates',
                    click: function() {
                        checkForUpdates(function(hasUpdates) {
                            if (hasUpdates) return
                            showMessageBox('There are no updates available.')
                        })
                    }
                },
                { type: 'separator' },
                {
                    label: 'GitHub &Respository',
                    click: function() {
                        shell.openExternal('https://github.com/yishn/' + app.getName())
                    }
                },
                {
                    label: 'Report &Issue',
                    click: function() {
                        shell.openExternal('https://github.com/yishn/' + app.getName() + '/issues')
                    }
                }
            ]
        }
    ]
    var menu = Menu.buildFromTemplate(template)

    document.body.store('mainmenu', menu)
    Menu.setApplicationMenu(menu)
}

function openHeaderMenu() {
    var template = [
        {
            label: '&Pass',
            click: function() { makeMove(new Tuple(-1, -1)) }
        },
        {
            label: '&Score',
            click: function() { setScoringMode(true) }
        },
        { type: 'separator' },
        {
            label: '&Edit',
            click: function() { setEditMode(true) }
        },
        {
            label: '&Find',
            click: function() { setFindMode(true) }
        },
        { type: 'separator' },
        {
            label: '&Info',
            click: showGameInfo
        }
    ]

    menu = Menu.buildFromTemplate(template)
    menu.popup(remote.getCurrentWindow(), $('headermenu').getPosition().x, $$('header')[0].getCoordinates().top)
}

function openNodeMenu(tree, index) {
    if (getScoringMode()) return

    var template = [
        {
            label: '&Remove',
            click: function() {
                removeNode(tree, index)
            }
        }
    ]

    menu = Menu.buildFromTemplate(template)
    menu.popup(remote.getCurrentWindow(), event.x, event.y)
}

/**
 * Drawers
 */

function showGameInfo() {
    closeScore()

    var tree = getRootTree()
    var rootNode = tree.nodes[0]
    var info = $('info')

    info.addClass('show').getElement('input[name="name_1"]').focus()

    info.getElement('input[name="name_1"]').set('value', getPlayerName(1))
    info.getElement('input[name="name_-1"]').set('value', getPlayerName(-1))
    info.getElement('input[name="rank_1"]').set('value', 'BR' in rootNode ? rootNode.BR[0] : '')
    info.getElement('input[name="rank_-1"]').set('value', 'WR' in rootNode ? rootNode.WR[0] : '')
    info.getElement('input[name="result"]').set('value', 'RE' in rootNode ? rootNode.RE[0] : '')
    info.getElement('input[name="komi"]').set('value', 'KM' in rootNode ? rootNode.KM[0].toFloat() : '')

    var size = info.getElement('input[name="size"]')
    size.set('value', 'SZ' in rootNode ? rootNode.SZ[0] : '')

    var handicap = info.getElement('select[name="handicap"]')
    if ('HA' in rootNode) handicap.selectedIndex = Math.max(0, rootNode.HA[0].toInt() - 1)
    else handicap.selectedIndex = 0

    var disabled = tree.nodes.length > 1 || tree.subtrees.length > 0
    handicap.disabled = disabled
    size.disabled = disabled
}

function closeGameInfo() {
    $('info').removeClass('show')
}

function showScore() {
    var board = $('goban').retrieve('finalboard')
    var score = board.getScore($('goban').retrieve('areamap'))
    var rootNode = getRootTree().nodes[0]

    for (var sign = -1; sign <= 1; sign += 2) {
        var tr = $$('#score tbody tr' + (sign < 0 ? ':last-child' : ''))[0]
        var tds = tr.getElements('td')

        tds[0].set('text', score['area_' + sign])
        tds[1].set('text', score['territory_' + sign])
        tds[2].set('text', score['captures_' + sign])
        if (sign < 0) tds[3].set('text', ('KM' in rootNode ? rootNode.KM[0] : '0').toFloat())
        tds[4].set('text', 0)

        setScoringMethod(setting.get('scoring.method'))
    }

    closeGameInfo()
    $('score').addClass('show')
}

function closeScore() {
    $('score').removeClass('show')
    setScoringMode(false)
}

function closeDrawers() {
    closeGameInfo()
    closeScore()
    setEditMode(false)
    setScoringMode(false)
    setFindMode(false)
}

/**
 * Main
 */

document.addEvent('domready', function() {
    document.title = app.getName();
    buildMenu()

    document.body.addEvent('mouseup', function() {
        $('goban').store('mousedown', false)
    })

    // Find bar buttons

    $$('#find button').addEvent('click', function() {
        $$('#find button').removeClass('selected')
        this.addClass('selected')
    })

    // Properties scrollbar

    var scrollbar = new Scrollbar({
        element: $('properties'),
        createElements: false
    }).create()

    $('properties').store('scrollbar', scrollbar)

    // Resize sidebar

    $$('#sidebar .verticalresizer').addEvent('mousedown', function() {
        if (event.button != 0) return
        $('sidebar').store('initposx', new Tuple(event.x, getSidebarWidth()))
    })
    $$('#sidebar .horizontalresizer').addEvent('mousedown', function() {
        if (event.button != 0) return
        $('sidebar').store('initposy', new Tuple(event.y, getCommentHeight()))
        $('properties').setStyle('transition', 'none')
    })

    document.body.addEvent('mouseup', function() {
        var initPosX = $('sidebar').retrieve('initposx')
        var initPosY = $('sidebar').retrieve('initposy')
        if (!initPosX && !initPosY) return

        if (initPosX) {
            $('sidebar').store('initposx', null)
            setting.set('view.sidebar_width', getSidebarWidth())
        } else if (initPosY) {
            $('sidebar').store('initposy', null)
            $('properties').setStyle('transition', '')
            setting.set('view.comments_height', getCommentHeight())
            setSidebarArrangement(true, true, false)
        }

        if ($('graph').retrieve('sigma'))
            $('graph').retrieve('sigma').renderers[0].resize().render()
    }).addEvent('mousemove', function() {
        var initPosX = $('sidebar').retrieve('initposx')
        var initPosY = $('sidebar').retrieve('initposy')
        if (!initPosX && !initPosY) return

        if (initPosX) {
            initPosX.unpack(function(initX, initWidth) {
                var newwidth = Math.max(initWidth - event.x + initX, setting.get('view.sidebar_minwidth'))
                setSidebarWidth(newwidth)
                resizeBoard()
            })
        } else if (initPosY) {
            initPosY.unpack(function(initY, initHeight) {
                var newheight = Math.min(Math.max(
                    initHeight + (initY - event.y) * 100 / $('sidebar').getSize().y,
                    setting.get('view.comments_minheight')
                ), 100 - setting.get('view.comments_minheight'))

                setCommentHeight(newheight)
            })
        }

        $('properties').retrieve('scrollbar').update()
    })
})
