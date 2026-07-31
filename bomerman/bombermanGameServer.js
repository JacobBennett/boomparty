(self.webpackJsonp = self.webpackJsonp || []).push([[4], {
    1212: function(e, t, i) {
        "use strict";
        i.r(t),
        i.d(t, "BombermanGameClient", (function() {
            return Ee
        }
        ));
        var s = i(5)
          , r = i(35)
          , o = i(77);
        const a = "tiles"
          , n = 32;
        var l = i(426)
          , d = i(12)
          , h = (i(1294),
        i(1233))
          , c = i.n(h);
        function p(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        class u extends c.a.Sprite {
            constructor(e, t, i, s, r) {
                let o = arguments.length > 5 && void 0 !== arguments[5] ? arguments[5] : 0;
                r instanceof c.a.BitmapData || "string" == typeof r ? (super(e, i, s, r, o),
                p(this, "id", void 0),
                p(this, "grid", void 0),
                p(this, "gridPos", void 0)) : (super(e, i, s, a, o),
                p(this, "id", void 0),
                p(this, "grid", void 0),
                p(this, "gridPos", void 0)),
                this.anchor.setTo(.5),
                this.game.physics.p2.enable(this),
                this.body.clearShapes(),
                this.grid = t,
                this.grid.add(this)
            }
            destroy() {
                this.grid.remove(this),
                super.destroy()
            }
            kill() {
                return super.kill()
            }
        }
        function m(e, t) {
            const i = e / 896
              , s = t / 576;
            return Math.min(s, i)
        }
        function g(e, t) {
            return t.children.filter((e => e instanceof u)).map((e => e)).find((t => t.id === e))
        }
        function b(e, t) {
            const i = g(e, t);
            i && i.destroy()
        }
        function y(e, t) {
            var i = Object.keys(e);
            if (Object.getOwnPropertySymbols) {
                var s = Object.getOwnPropertySymbols(e);
                t && (s = s.filter((function(t) {
                    return Object.getOwnPropertyDescriptor(e, t).enumerable
                }
                ))),
                i.push.apply(i, s)
            }
            return i
        }
        function f(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        let w = function(e) {
            return e.Boot = "boot",
            e.Preload = "preload",
            e.Lobby = "lobby",
            e.Play = "play",
            e.Win = "win",
            e
        }({});
        class v extends Phaser.State {
            constructor() {
                super(...arguments),
                f(this, "attendeeId", void 0),
                f(this, "emitter", void 0),
                f(this, "logger", void 0),
                f(this, "windowHandle", void 0),
                f(this, "isActiveState", !0)
            }
            init(e) {
                let {attendeeId: t, emitter: i, logger: s, windowHandle: r} = e;
                this.attendeeId = t,
                this.emitter = i,
                this.logger = s,
                this.windowHandle = r,
                this.isActiveState = !0
            }
            shutdown() {
                this.isActiveState = !1
            }
            gameWillClose() {}
            startState(e, t) {
                this.state.start(e, !0, !1, function(e) {
                    for (var t = 1; t < arguments.length; t++) {
                        var i = null != arguments[t] ? arguments[t] : {};
                        t % 2 ? y(Object(i), !0).forEach((function(t) {
                            f(e, t, i[t])
                        }
                        )) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(i)) : y(Object(i)).forEach((function(t) {
                            Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(i, t))
                        }
                        ))
                    }
                    return e
                }({
                    attendeeId: this.attendeeId,
                    emitter: this.emitter,
                    logger: this.logger
                }, t))
            }
            assertIsActiveState() {
                if (!this.isActiveState)
                    throw new Error("State has already shut down")
            }
        }
        function P(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        class G extends v {
            constructor() {
                super(...arguments),
                P(this, "gameContainerElement", void 0),
                P(this, "handlePortalResize", ( () => {
                    const e = this.gameContainerElement.getBoundingClientRect();
                    this.setScale(this.game.scale, e.width, e.height, !0)
                }
                ))
            }
            init(e) {
                let {attendeeId: t, emitter: i, logger: s, scale: r, parent: o, windowHandle: a} = e;
                super.init({
                    attendeeId: t,
                    emitter: i,
                    logger: s,
                    windowHandle: a
                }),
                this.logger.debug("Boot:init()"),
                this.gameContainerElement = o,
                this.game.scale.scaleMode = c.a.ScaleManager.USER_SCALE,
                this.game.scale.setUserScale(r, r),
                this.game.scale.pageAlignHorizontally = !0,
                this.windowHandle ? this.windowHandle.addEventListener("resize", this.handlePortalResize) : this.game.scale.setResizeCallback(this.handlePortalResize, this)
            }
            create() {
                this.logger.debug("Boot:create()"),
                this.game.stage.disableVisibilityChange = !0,
                this.startState(w.Preload, {
                    windowHandle: this.windowHandle
                }),
                this.handlePortalResize()
            }
            gameWillClose() {
                this.logger.debug("Boot:gameWillClose()"),
                this.windowHandle && this.windowHandle.removeEventListener("resize", this.handlePortalResize)
            }
            shutdown() {
                this.logger.debug("Boot:shutdown()"),
                super.shutdown()
            }
            setScale(e, t, i) {
                let s = arguments.length > 3 && void 0 !== arguments[3] && arguments[3];
                const r = m(t, i);
                e.setUserScale(r, r, void 0, void 0, s, s)
            }
        }
        P(G, "key", w.Boot);
        var x, S, k, C = i.p + "static/media/tileset.79b7db79ca3a2477bc442d67a12b81ac.png", E = i.p + "static/media/explosion_center.7bea154d71a86cac2d028bf0e96d1f19.png", T = i.p + "static/media/explosion_horizontal.c43f5e3a7098180e3a08a1e6fb2e5feb.png", I = i.p + "static/media/explosion_vertical.abf6f92a2e554761a6a607d045e881c7.png", j = i.p + "static/media/explosion_up.d18d6cc9e79a46571cdd1345782e1cba.png", _ = i.p + "static/media/explosion_right.1b27a574ccf5ab42feafe0c6c529fa03.png", B = i.p + "static/media/explosion_down.7acca91b1e1406debd2220db30627d2b.png", O = i.p + "static/media/explosion_left.3dc73eedc3de2ef68e056ce7887f6fcd.png", H = i.p + "static/media/spoil_tileset.4b62df2ebc3fb803486903cbf772ac9f.png", D = i.p + "static/media/bone_tileset.c767b1b829cb7b87a34fd9f123d0885a.png", A = i.p + "static/media/bombs.878f27b91f7336f6cac87dd184882b06.png", L = i.p + "static/media/speed_up_bonus.e69c51f3735435ad287cefcc4e5617ee.png", F = i.p + "static/media/bomb_up_bonus.07849e35d943611083fbcb2b8fe9bb7b.png", K = i.p + "static/media/power_up_bonus.a10eb8066ed1a75d37903a4799bcb4ed.png", z = i.p + "static/media/placeholder_power.6b122b4129f0fa68b4400fa2973c1ad9.png", R = i.p + "static/media/placeholder_speed.35091541243226bc3947afed5a459ebb.png", N = i.p + "static/media/placeholder_bomb.0913e091d7a036c4356b2fe709cdf1ca.png", M = i.p + "static/media/avatar_mask28.d634c66624dd17ca6fa89be7107fc609.png", U = i.p + "static/media/avatar_mask32.3cc14ca5358ff8b637916b9b41f61f84.png", W = i.p + "static/media/avatar_mask35.29caefab166cdc70a75585bfba226a53.png", J = i.p + "static/media/avatar_mask64.68a02d0cbf61b45d7e9b807309a77d74.png", V = i.p + "static/media/avatar28.d63da0bd1f828ab5afa15bb84731746e.png", Y = i.p + "static/media/avatar32.7f3a64ea9f53dcb31b97cb3f5aebd3bc.png", X = i.p + "static/media/avatar64.b4c7dbcb1892e23d176f20837f290240.png";
        class Z extends v {
            init(e) {
                let {attendeeId: t, emitter: i, logger: s, windowHandle: r} = e;
                super.init({
                    attendeeId: t,
                    emitter: i,
                    logger: s,
                    windowHandle: r
                }),
                this.logger.debug("Preload:init()")
            }
            preload() {
                this.logger.debug("Preload:preload()"),
                this.load.spritesheet(a, C, n, n),
                this.load.spritesheet("explosion_center", E, n, n),
                this.load.spritesheet("explosion_horizontal", T, n, n),
                this.load.spritesheet("explosion_vertical", I, n, n),
                this.load.spritesheet("explosion_up", j, n, n),
                this.load.spritesheet("explosion_right", _, n, n),
                this.load.spritesheet("explosion_down", B, n, n),
                this.load.spritesheet("explosion_left", O, n, n),
                this.load.spritesheet("spoil_tileset", H, n, n),
                this.load.spritesheet("bone_tileset", D, n, n),
                this.load.spritesheet("bomb_tileset", A, n, n),
                this.load.image("speed_up_bonus", L),
                this.load.image("bomb_up_bonus", F),
                this.load.image("power_up_bonus", K),
                this.load.image("placeholder_power", z),
                this.load.image("placeholder_speed", R),
                this.load.image("placeholder_bomb", N),
                this.load.image("avatar_mask28", M),
                this.load.image("avatar_mask32", U),
                this.load.image("avatar_mask35", W),
                this.load.image("avatar_mask64", J),
                this.load.image("avatar28", V),
                this.load.image("avatar32", Y),
                this.load.image("avatar64", X)
            }
            create() {
                this.logger.debug("Preload:create()"),
                this.startState(w.Lobby, {
                    windowHandle: this.windowHandle
                })
            }
            shutdown() {
                this.logger.debug("Preload:shutdown()"),
                super.shutdown()
            }
        }
        function q(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        x = Z,
        S = "key",
        k = w.Preload,
        (S = function(e) {
            var t = function(e, t) {
                if ("object" != typeof e || null === e)
                    return e;
                var i = e[Symbol.toPrimitive];
                if (void 0 !== i) {
                    var s = i.call(e, t || "default");
                    if ("object" != typeof s)
                        return s;
                    throw new TypeError("@@toPrimitive must return a primitive value.")
                }
                return ("string" === t ? String : Number)(e)
            }(e, "string");
            return "symbol" == typeof t ? t : String(t)
        }(S))in x ? Object.defineProperty(x, S, {
            value: k,
            enumerable: !0,
            configurable: !0,
            writable: !0
        }) : x[S] = k;
        class Q extends c.a.Text {
            constructor(e) {
                let {game: t, x: i, y: s, text: r, style: o} = e;
                super(t, i, s, r, o),
                this.anchor.setTo(.5),
                this.game.add.existing(this)
            }
        }
        c.a.Button;
        c.a.Button;
        class $ extends c.a.Group {
            constructor(e) {
                let {game: t, me: i, enemies: s, x: r, y: o} = e;
                if (super(t),
                s.length > 0) {
                    const e = this.game.cache.checkBitmapDataKey("".concat(i.id, "-large")) ? this.game.cache.getBitmapData("".concat(i.id, "-large")) : "avatar64"
                      , t = new c.a.Image(this.game,r,o,e)
                      , a = new c.a.Text(this.game,0,t.height + 20,"vs",{
                        font: "20px Arial",
                        fill: "#FFFFFF"
                    });
                    if (a.anchor.setTo(.5),
                    t.addChild(a),
                    s.length > 0) {
                        const e = 10;
                        let i = ""
                          , r = 32 + e;
                        this.game.width / s.length > 64 && (i = "-large",
                        r = 64 + e);
                        const o = r * s.length;
                        for (const e of s) {
                            const n = s.indexOf(e)
                              , l = "".concat(e.id).concat(i)
                              , d = this.game.cache.checkBitmapDataKey(l) ? this.game.cache.getBitmapData(l) : "avatar64"
                              , h = new c.a.Image(this.game,0 - o / 2 + r / 2 + n * r,t.height + a.height + 40,d);
                            h.anchor.setTo(.5),
                            t.addChild(h)
                        }
                    }
                    t.anchor.setTo(.5, 0),
                    this.add(t)
                } else {
                    const e = new c.a.Text(this.game,r,o,"Starting game in single player mode",{
                        font: "20px Arial",
                        fill: "#FFFFFF"
                    });
                    e.anchor.setTo(.5),
                    this.addChild(e)
                }
            }
            destroy() {
                this.callAll("kill", null)
            }
        }
        class ee extends c.a.Group {
            constructor(e) {
                let {game: t, key: i, x: s, y: r} = e;
                super(t),
                q(this, "image", void 0),
                q(this, "tween", void 0),
                this.image = new c.a.Image(this.game,s,r - 20,i),
                this.image.anchor.setTo(.5),
                this.add(this.image),
                this.tween = this.game.add.tween(this.image),
                this.tween.to({
                    y: this.image.y - 25,
                    alpha: 0
                }, 600),
                this.tween.onComplete.add(this.finish, this),
                this.tween.start()
            }
            finish() {
                this.callAll("kill", null)
            }
        }
        function te(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        class ie extends v {
            constructor() {
                super(...arguments),
                te(this, "observer", void 0),
                te(this, "statusText", void 0),
                te(this, "playerSlots", void 0),
                te(this, "failedLoadPlayerData", new Set)
            }
            init(e) {
                let {attendeeId: t, emitter: i, logger: s, windowHandle: r} = e;
                super.init({
                    attendeeId: t,
                    emitter: i,
                    logger: s,
                    windowHandle: r
                }),
                this.logger.debug("Lobby:init()"),
                this.observer = !1,
                this.enterGame()
            }
            create() {
                this.logger.debug("Lobby:create()"),
                this.statusText = new Q({
                    game: this.game,
                    x: this.game.world.centerX,
                    y: this.game.world.centerY - 50,
                    text: "Waiting for another player ...",
                    style: {
                        font: "35px Arial",
                        fill: "#FFFFFF"
                    }
                })
            }
            shutdown() {
                this.logger.debug("Lobby:shutdown()"),
                super.shutdown()
            }
            async handleStartGame(e) {
                this.logger.debug("Lobby:handleStartGame()"),
                await this.loadPlayerData(e.game.players),
                this.assertIsActiveState(),
                this.startGame(e.game)
            }
            async handleStartGameCountdown(e) {
                this.logger.debug("Lobby:handleStartGameCountdown() [countdown:".concat(e.countdown, "]")),
                this.statusText.setText("Get ready, game starts in ".concat(e.countdown)),
                await this.loadPlayerData(e.players),
                this.assertIsActiveState();
                const t = e.players.find((e => e.id === this.attendeeId))
                  , i = e.players.filter((e => e.id !== this.attendeeId));
                if (!t)
                    throw new Error("Joined attendee not found as a player");
                this.playerSlots && this.playerSlots.destroy(),
                this.playerSlots = new $({
                    game: this.game,
                    me: t,
                    enemies: i,
                    x: this.game.world.centerX,
                    y: this.game.world.centerY
                })
            }
            async handleObserveGame(e) {
                this.logger.debug("Lobby:handleObserveGame()"),
                this.observer = !0,
                await this.loadPlayerData(e.game.players),
                this.assertIsActiveState(),
                this.startGame(e.game)
            }
            enterGame() {
                this.logger.debug("Lobby:enterGame()"),
                this.emitter.safeEmit("enter-game")
            }
            startGame(e) {
                this.logger.debug("Lobby:startGame()"),
                this.startState(w.Play, {
                    game: e,
                    observer: this.observer,
                    windowHandle: this.windowHandle
                })
            }
            async loadPlayerData(e) {
                this.logger.debug("Lobby:loadPlayerData()");
                try {
                    const t = await Promise.allSettled(e.filter((e => !this.game.cache.checkImageKey(e.id) && !this.failedLoadPlayerData.has(e.id))).map((async e => await this.loadPlayerProfilePicture(e))));
                    for (const e of t)
                        "rejected" === e.status && this.failedLoadPlayerData.add(e.reason)
                } catch (e) {
                    this.logger.warn("loadPlayerData() | failed to load player data: ".concat(e))
                }
            }
            async loadPlayerProfilePicture(e) {
                return this.logger.debug("Lobby:loadPlayerProfilePicture() [playerId:".concat(e.id, ", profilePicture:").concat(e.profilePictureSmall, "]")),
                new Promise((async (t, i) => {
                    try {
                        const s = e.profilePictureSmall;
                        if (!s)
                            return this.logger.warn("Lobby:loadPlayerProfilePicture() [playerId:".concat(e.id, "] | no profile picture set")),
                            i(new Error("no profile picture set"));
                        {
                            const r = await fetch(s + "?randomParam=123sd48");
                            if (this.assertIsActiveState(),
                            !r.ok)
                                return this.logger.warn("Lobby:loadPlayerProfilePicture() [playerId:".concat(e.id, "] | fetch failed: ").concat(r.status, ", ").concat(r.statusText)),
                                i(new Error("fetch failed"));
                            const o = await r.blob();
                            this.assertIsActiveState();
                            const a = new FileReader;
                            a.readAsDataURL(o),
                            a.onloadend = () => {
                                const i = a.result
                                  , r = (e, t, i, s) => {
                                    const r = new c.a.Image(this.game,0,0,e);
                                    r.scale.set(s / r.width, s / r.height);
                                    const o = new c.a.BitmapData(this.game,t,s,s);
                                    o.alphaMask(r, i),
                                    this.game.cache.addBitmapData(t, o)
                                }
                                  , o = (t, i) => {
                                    this.game.cache.addImage(e.id, t, i),
                                    r(e.id, e.id, "avatar_mask28", 28),
                                    r(e.id, "".concat(e.id, "-medium"), "avatar_mask32", 32),
                                    r(e.id, "".concat(e.id, "-large"), "avatar_mask64", 64)
                                }
                                  , n = new Image;
                                if (n.src = i,
                                n.onload = () => (o(s, n),
                                t()),
                                n.complete)
                                    return n.onload = null,
                                    o(s, n),
                                    t()
                            }
                        }
                    } catch (t) {
                        return this.logger.debug("Lobby:loadPlayerProfilePicture() [playerId:".concat(e.id, "] | failed: ").concat(t)),
                        i(t)
                    }
                }
                ))
            }
        }
        function se(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        te(ie, "key", w.Lobby);
        class re {
            constructor(e, t) {
                let i = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : n;
                se(this, "width", void 0),
                se(this, "height", void 0),
                se(this, "size", void 0),
                se(this, "items", void 0),
                this.width = e,
                this.height = t,
                this.size = i,
                this.items = []
            }
            add(e) {
                this.items.push(e),
                e.gridPos = this.screenToGrid(e.x, e.y)
            }
            remove(e) {
                -1 !== this.items.indexOf(e) && this.items.splice(this.items.indexOf(e), 1)
            }
            getAt(e, t, i) {
                if (e >= 0 && e < this.width && t >= 0 && t < this.height) {
                    for (let s = 0; s < this.items.length; s++) {
                        const r = this.items[s];
                        if (r !== i && r.gridPos.x === e && r.gridPos.y === t)
                            return r
                    }
                    return null
                }
                return -1
            }
            screenToGrid(e, t, i) {
                return i ? (i.x = Math.round(e / this.size),
                i.y = Math.round(t / this.size),
                i) : new c.a.Point(Math.round(e / this.size),Math.round(t / this.size))
            }
            gridToScreen(e, t, i) {
                return i ? (i.x = e * this.size,
                i.y = t * this.size,
                i) : new c.a.Point(e * this.size,t * this.size)
            }
        }
        class oe extends u {
            constructor(e) {
                let {game: t, grid: i, x: s, y: r, index: o} = e;
                super(t, i, s, r, void 0, null != o ? o : 0),
                this.body.static = !0,
                this.body.addRectangle(n, n, 16, 16)
            }
            kill() {
                return this
            }
        }
        class ae extends oe {
            constructor(e) {
                let {game: t, grid: i, x: s, y: r} = e;
                super({
                    game: t,
                    grid: i,
                    x: s,
                    y: r,
                    index: 1
                }),
                this.frame = 1
            }
            kill() {
                return this.game.add.tween(this).to({
                    alpha: 0
                }, 300, c.a.Easing.Linear.None, !0).onComplete.add(( () => {
                    this.destroy()
                }
                ), this),
                this
            }
        }
        function ne(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        class le {
            constructor(e, t) {
                ne(this, "game", void 0),
                ne(this, "player", void 0),
                ne(this, "speedText", void 0),
                ne(this, "powerText", void 0),
                ne(this, "bombsText", void 0),
                ne(this, "deadText", void 0),
                this.game = e,
                this.player = t;
                const i = {
                    font: "14px Arial",
                    fill: "#ffffff",
                    align: "left"
                }
                  , s = new c.a.Image(this.game,5,2,"placeholder_speed");
                this.speedText = new c.a.Text(this.game,32,7,this.speedLabel(),i),
                s.addChild(this.speedText),
                this.game.add.existing(s);
                const r = new c.a.Image(this.game,110,2,"placeholder_power");
                this.powerText = new c.a.Text(this.game,32,7,this.powerLabel(),i),
                r.addChild(this.powerText),
                this.game.add.existing(r);
                const o = new c.a.Image(this.game,215,2,"placeholder_bomb");
                this.bombsText = new c.a.Text(this.game,32,7,this.bombsLabel(),i),
                o.addChild(this.bombsText),
                this.game.add.existing(o),
                this.deadText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, "You died", {
                    font: "130px Arial",
                    fill: "#FFFFF"
                }),
                this.deadText.alpha = .3,
                this.deadText.anchor.setTo(.5),
                this.deadText.visible = !1
            }
            refreshStatistic() {
                this.speedText.text = this.speedLabel(),
                this.powerText.text = this.powerLabel(),
                this.bombsText.text = this.bombsLabel()
            }
            showDeadInfo() {
                this.deadText.visible = !0
            }
            speedLabel() {
                return "x ".concat(this.player.speed)
            }
            powerLabel() {
                return "x ".concat(this.player.power)
            }
            bombsLabel() {
                return "x ".concat(this.player.totalBombs)
            }
        }
        function de(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        class he extends u {
            constructor(e) {
                let {emitter: t, windowHandle: i, game: s, grid: r, timers: o, id: a, spawn: n, name: l, imageData: d} = e;
                super(s, r, n.x, n.y, d),
                de(this, "id", void 0),
                de(this, "emitter", void 0),
                de(this, "windowHandle", void 0),
                de(this, "controls", void 0),
                de(this, "keys", new Map),
                de(this, "spaceKey", void 0),
                de(this, "bombTime", void 0),
                de(this, "speed", void 0),
                de(this, "power", void 0),
                de(this, "totalBombs", void 0),
                de(this, "currentBombs", void 0),
                de(this, "lastGridPos", void 0),
                de(this, "prevPosition", void 0),
                de(this, "blastThrough", void 0),
                de(this, "info", void 0),
                de(this, "handleKeyDown", (e => {
                    this.keys.set(e.key, !0)
                }
                )),
                de(this, "handleKeyUp", (e => {
                    this.keys.set(e.key, !1)
                }
                )),
                this.id = a,
                this.emitter = t,
                this.windowHandle = i,
                this.name = l,
                this.windowHandle ? (this.keys.clear(),
                this.windowHandle.addEventListener("keydown", this.handleKeyDown, {
                    capture: !0
                }),
                this.windowHandle.addEventListener("keyup", this.handleKeyUp, {
                    capture: !0
                })) : (this.controls = this.game.input.keyboard.createCursorKeys(),
                this.spaceKey = s.input.keyboard.addKey(c.a.Keyboard.SPACEBAR)),
                this.speed = 1,
                this.power = 1,
                this.totalBombs = 1,
                this.currentBombs = 0,
                this.body.dynamic = !0,
                this.body.addCircle(14, 16, 16),
                this.body.fixedRotation = !0,
                this.lastGridPos = this.gridPos.clone(),
                this.prevPosition = n,
                this.blastThrough = !0,
                this.bombTime = 0,
                o.push(s.time.events.loop(100, this.positionUpdaterLoop.bind(this))),
                this.info = new le(this.game,this),
                this.defineSelf(l)
            }
            update() {
                super.update();
                const e = 60 * this.game.time.elapsedMS / 1e3;
                this.alive && (this.body.dynamic = !0,
                this.body.setZeroVelocity(),
                this.isKeyUpPressed() ? this.body.moveUp(this.currentSpeed() * e) : this.isKeyDownPressed() && this.body.moveDown(this.currentSpeed() * e),
                this.isKeyLeftPressed() ? this.body.moveLeft(this.currentSpeed() * e) : this.isKeyRightPressed() && this.body.moveRight(this.currentSpeed() * e),
                this.isKeySpacePressed() && this.dropBomb(),
                this.gridPos && this.grid.screenToGrid(this.x, this.y, this.gridPos))
            }
            kill() {
                return this.body.moves = !1,
                this.info.showDeadInfo(),
                this.windowHandle && (this.windowHandle.removeEventListener("keydown", this.handleKeyDown, {
                    capture: !0
                }),
                this.windowHandle.removeEventListener("keyup", this.handleKeyUp, {
                    capture: !0
                })),
                super.kill()
            }
            currentSpeed() {
                return 150 + 15 * (this.speed - 1)
            }
            positionUpdaterLoop() {
                const e = {
                    x: this.position.x,
                    y: this.position.y
                };
                c.a.Math.fuzzyEqual(this.prevPosition.x, e.x, 3) && c.a.Math.fuzzyEqual(this.prevPosition.y, e.y, 3) || (this.emitter.safeEmit("player-position-update", {
                    x: e.x,
                    y: e.y
                }),
                this.prevPosition = new c.a.Point(e.x,e.y))
            }
            canPlaceBomb(e) {
                return !this.grid.getAt(e.x, e.y, this)
            }
            dropBomb() {
                if (this.game.time.now <= this.bombTime)
                    return;
                const e = this.gridPos.clone();
                this.currentBombs < this.totalBombs && this.canPlaceBomb(e) && (this.bombTime = this.game.time.now + 150,
                this.emitter.safeEmit("player-bomb-create", {
                    col: e.x,
                    row: e.y
                }))
            }
            pickSpoil(e) {
                0 === e && this.increaseSpeed(),
                1 === e && this.increasePower(),
                2 === e && this.increaseBombs()
            }
            increaseSpeed() {
                let e = "speed_up_no_bonus";
                this.speed = this.speed + 1,
                this.info.refreshStatistic(),
                e = "speed_up_bonus",
                new ee({
                    game: this.game,
                    key: "speed_up_bonus",
                    x: this.position.x,
                    y: this.position.y
                })
            }
            increaseBombs() {
                this.totalBombs += 1,
                this.info.refreshStatistic(),
                new ee({
                    game: this.game,
                    key: "bomb_up_bonus",
                    x: this.position.x,
                    y: this.position.y
                })
            }
            increasePower() {
                this.power += 1,
                this.info.refreshStatistic(),
                new ee({
                    game: this.game,
                    key: "power_up_bonus",
                    x: this.position.x,
                    y: this.position.y
                })
            }
            defineSelf(e) {
                const t = new Q({
                    game: this.game,
                    x: 0,
                    y: -26,
                    text: "✮ ".concat(e, " ✮"),
                    style: {
                        font: "15px Arial",
                        fill: "#ffff00",
                        stroke: "#000000",
                        strokeThickness: 3
                    }
                });
                t.anchor.setTo(.5),
                this.addChild(t)
            }
            isKeyUpPressed() {
                return this.windowHandle ? this.keys.get("ArrowUp") || !1 : this.controls.up.isDown
            }
            isKeyDownPressed() {
                return this.windowHandle ? this.keys.get("ArrowDown") || !1 : this.controls.down.isDown
            }
            isKeyLeftPressed() {
                return this.windowHandle ? this.keys.get("ArrowLeft") || !1 : this.controls.left.isDown
            }
            isKeyRightPressed() {
                return this.windowHandle ? this.keys.get("ArrowRight") || !1 : this.controls.right.isDown
            }
            isKeySpacePressed() {
                return this.windowHandle ? this.keys.get(" ") || !1 : this.spaceKey.isDown
            }
        }
        function ce(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        class pe extends u {
            constructor(e) {
                let {game: t, id: i, spawn: s, name: r, imageData: o, grid: a} = e;
                super(t, a, s.x, s.y, o),
                ce(this, "lastMoveAt", void 0),
                this.game = t,
                this.id = i,
                this.lastMoveAt = 0,
                this.game.physics.p2.enable(this),
                this.body.clearShapes(),
                this.body.static = !0,
                this.body.setCircle(14, 16, 16),
                this.defineSelf(r)
            }
            goTo(e) {
                this.lastMoveAt = this.game.time.now,
                this.game.add.tween(this.body).to(e, 100, c.a.Easing.Linear.None, !0)
            }
            defineSelf(e) {
                const t = new Q({
                    game: this.game,
                    x: 0,
                    y: -26,
                    text: "".concat(e),
                    style: {
                        font: "15px Arial",
                        fill: "#FFFFFF",
                        stroke: "#000000",
                        strokeThickness: 3
                    }
                });
                t.anchor.setTo(.5),
                this.addChild(t)
            }
        }
        function ue(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        class me extends u {
            constructor(e) {
                let {game: t, grid: i, x: s, y: r, bombId: o, owner: a} = e;
                super(t, i, s, r, "bomb_tileset"),
                ue(this, "owner", void 0),
                this.owner = a,
                this.id = o,
                this.game.physics.p2.enable(this),
                this.body.clearShapes(),
                this.body.static = !0,
                this.body.addRectangle(n, n, 16, 16),
                this.owner && (this.owner.currentBombs += 1),
                this.game.add.tween(this.scale).to({
                    x: 1.2,
                    y: 1.2
                }, 2e3, c.a.Easing.Linear.None, !0),
                this.animations.add("bomb", [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 6, !0),
                this.animations.play("bomb")
            }
            explode() {
                this.owner && (this.owner.currentBombs -= 1),
                this.grid.remove(this),
                this.destroy()
            }
            kill() {
                return this.explode(),
                this
            }
        }
        function ge(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        class be extends u {
            constructor(e) {
                let t, {game: i, grid: s, id: r, col: o, row: a, type: l} = e;
                2 === l && (t = 0),
                1 === l && (t = 1),
                0 === l && (t = 2),
                super(i, s, o * n, a * n, "spoil_tileset", t),
                ge(this, "id", void 0),
                this.id = r,
                this.game.physics.p2.enable(this),
                this.body.clearShapes(),
                this.body.static = !0,
                this.body.addRectangle(n, n, 16, 16)
            }
        }
        class ye extends c.a.Sprite {
            constructor(e) {
                let {game: t, col: i, row: s, type: r} = e;
                super(t, i * n, s * n, r, 0),
                this.game = t,
                this.animations.add("blast", [0, 1, 2, 3, 4]),
                this.play("blast", 15, !1, !0),
                this.game.physics.p2.enable(this),
                this.body.clearShapes(),
                this.body.static = !0,
                this.body.addRectangle(n, n, 16, 16)
            }
        }
        class fe extends c.a.Sprite {
            constructor(e) {
                let {game: t, col: i, row: s} = e;
                super(t, i * n, s * n, "bone_tileset"),
                this.game.physics.p2.enable(this),
                this.body.static = !0
            }
        }
        function we(e, t) {
            var i = Object.keys(e);
            if (Object.getOwnPropertySymbols) {
                var s = Object.getOwnPropertySymbols(e);
                t && (s = s.filter((function(t) {
                    return Object.getOwnPropertyDescriptor(e, t).enumerable
                }
                ))),
                i.push.apply(i, s)
            }
            return i
        }
        function ve(e) {
            for (var t = 1; t < arguments.length; t++) {
                var i = null != arguments[t] ? arguments[t] : {};
                t % 2 ? we(Object(i), !0).forEach((function(t) {
                    Pe(e, t, i[t])
                }
                )) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(i)) : we(Object(i)).forEach((function(t) {
                    Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(i, t))
                }
                ))
            }
            return e
        }
        function Pe(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        class Ge extends v {
            constructor() {
                super(...arguments),
                Pe(this, "currentGame", void 0),
                Pe(this, "player", void 0),
                Pe(this, "observer", void 0),
                Pe(this, "timers", void 0),
                Pe(this, "grid", void 0),
                Pe(this, "overlay", void 0),
                Pe(this, "background", void 0),
                Pe(this, "itemsGroup", void 0),
                Pe(this, "bonesGroup", void 0),
                Pe(this, "bombsGroup", void 0),
                Pe(this, "spoilsGroup", void 0),
                Pe(this, "enemiesGroup", void 0),
                Pe(this, "playerGroup", void 0),
                Pe(this, "blastsGroup", void 0),
                Pe(this, "itemsCollisionGroup", void 0),
                Pe(this, "bombsCollisionGroup", void 0),
                Pe(this, "spoilsCollisionGroup", void 0),
                Pe(this, "fireBlastsCollisionGroup", void 0),
                Pe(this, "enemiesCollisionGroup", void 0),
                Pe(this, "playerCollisionGroup", void 0),
                Pe(this, "handlePlayerPositionChanged", (e => {
                    let {playerId: t, x: i, y: s} = e;
                    if (this.enemiesGroup) {
                        const e = g(t, this.enemiesGroup);
                        if (!e)
                            return;
                        e.goTo(new c.a.Point(i,s))
                    }
                }
                )),
                Pe(this, "handleBombShow", (e => {
                    let {ownerId: t, id: i, col: s, row: r} = e;
                    this.logger.debug("Play:handleBombShow() [id:%s, col:%s, row:%s]", i, s, r);
                    const o = this.player && this.player.id === t ? this.player : void 0
                      , a = this.grid.gridToScreen(s, r)
                      , n = new me({
                        game: this.game,
                        grid: this.grid,
                        x: a.x,
                        y: a.y,
                        bombId: i,
                        owner: o
                    });
                    n.body.setCollisionGroup(this.bombsCollisionGroup),
                    n.body.collides(this.playerCollisionGroup),
                    this.bombsGroup.add(n)
                }
                )),
                Pe(this, "handleBombDetonate", (e => {
                    let {id: t, blastedCells: i} = e;
                    this.logger.debug("Play:handleBombDetonate() [id:%s]", t),
                    function(e, t) {
                        const i = g(e, t);
                        i && i.kill()
                    }(t, this.bombsGroup);
                    for (const e of i) {
                        const t = new ye({
                            game: this.game,
                            col: e.col,
                            row: e.row,
                            type: e.type
                        });
                        t.body.setCollisionGroup(this.spoilsCollisionGroup),
                        t.body.collides(this.playerCollisionGroup),
                        this.blastsGroup.add(t)
                    }
                    for (const e of i)
                        if (e.destroyed) {
                            const t = this.grid.gridToScreen(e.col, e.row);
                            this.background.create(t.x, t.y, a, 2).anchor.set(.5);
                            const i = this.grid.getAt(e.col, e.row);
                            i instanceof ae && i.kill()
                        }
                    for (const e of i)
                        if (e.destroyed && e.spoil) {
                            const t = new be({
                                game: this.game,
                                grid: this.grid,
                                id: e.spoil.id,
                                col: e.spoil.col,
                                row: e.spoil.row,
                                type: e.spoil.spoilType
                            });
                            t.body.setCollisionGroup(this.spoilsCollisionGroup),
                            t.body.collides(this.playerCollisionGroup),
                            this.spoilsGroup.add(t)
                        }
                }
                )),
                Pe(this, "handleSpoilDestroy", (e => {
                    let {spoils: t} = e;
                    this.logger.debug("Play:handleSpoilDestroy() [ids:%j]", t.map((e => e.id)));
                    for (const e of t)
                        b(e.id, this.spoilsGroup)
                }
                )),
                Pe(this, "handleSpoilPickedUp", (e => {
                    let {playerId: t, spoilId: i, spoilType: s} = e;
                    this.logger.debug("Play:handleSpoilPickedUp() [playerId:%s, spoilId:%s]", t, i),
                    this.player && t === this.player.id && this.player.pickSpoil(s),
                    b(i, this.spoilsGroup)
                }
                )),
                Pe(this, "handleBonesShow", (e => {
                    let {playerId: t, col: i, row: s} = e;
                    this.logger.debug("Play:handleBonesShow() [playerId:%s, col:%s, row:%s]", t, i, s),
                    this.bonesGroup.add(new fe({
                        game: this.game,
                        col: i,
                        row: s
                    })),
                    b(t, this.enemiesGroup),
                    b(t, this.playerGroup)
                }
                )),
                Pe(this, "handleWin", (e => {
                    var t;
                    let {playerId: i} = e;
                    this.logger.debug("Play:handleWin() [playerId:%s]", i);
                    const s = null === (t = this.currentGame) || void 0 === t ? void 0 : t.players.find((e => e.id === i));
                    this.startState(w.Win, {
                        name: null == s ? void 0 : s.name,
                        windowHandle: this.windowHandle
                    })
                }
                ))
            }
            init(e) {
                let {attendeeId: t, emitter: i, logger: s, windowHandle: r, game: o, observer: a} = e;
                super.init({
                    attendeeId: t,
                    emitter: i,
                    logger: s,
                    windowHandle: r
                }),
                this.logger.debug("Play:init()"),
                this.currentGame = o,
                this.observer = a,
                this.timers = []
            }
            create() {
                if (this.logger.debug("Play:create()"),
                this.game.time.advancedTiming = !0,
                this.game.renderer.renderSession.roundPixels = !0,
                this.setupPhysics(),
                this.createCollisionGroups(),
                this.createObjectGroups(),
                this.game.input.keyboard.addKeyCapture([c.a.Keyboard.UP, c.a.Keyboard.DOWN, c.a.Keyboard.LEFT, c.a.Keyboard.RIGHT, c.a.Keyboard.SPACEBAR]),
                this.createMap(),
                this.createPlayers(),
                this.observer && this.createCurrentSpoilsAndBombs(),
                this.overlay = this.game.add.group(),
                this.timers.push(this.game.time.events.loop(400, this.stopAnimationLoop.bind(this))),
                this.observer) {
                    const e = this.game.add.text(this.game.world.centerX, this.game.world.centerY, "Observer mode", {
                        font: "130px Arial",
                        fill: "#FFFFF"
                    }, this.overlay);
                    e.alpha = .3,
                    e.anchor.setTo(.5)
                }
            }
            shutdown() {
                this.logger.debug("Play:shutdown()"),
                super.shutdown();
                for (const e of this.timers)
                    this.game.time.events.remove(e);
                this.timers = [],
                this.currentGame = void 0,
                this.itemsGroup.removeAll(),
                this.bonesGroup.removeAll(),
                this.bombsGroup.removeAll(),
                this.spoilsGroup.removeAll(),
                this.enemiesGroup.removeAll(),
                this.playerGroup.removeAll(),
                this.blastsGroup.removeAll(),
                this.player = void 0
            }
            createMap() {
                const e = this.createMapData();
                this.grid = new re(28,18);
                for (let t = 0; t < this.grid.width; t++)
                    for (let i = 0; i < this.grid.height; i++)
                        if (this.background.create(t * this.grid.size, i * this.grid.size, a, 2).anchor.set(.5),
                        1 === e[i][t]) {
                            const e = new oe({
                                game: this.game,
                                grid: this.grid,
                                x: t * this.grid.size,
                                y: i * this.grid.size
                            });
                            this.itemsGroup.add(e),
                            e.body.setCollisionGroup(this.itemsCollisionGroup),
                            e.body.collides(this.playerCollisionGroup)
                        } else if (2 === e[i][t]) {
                            const e = new ae({
                                game: this.game,
                                grid: this.grid,
                                x: t * this.grid.size,
                                y: i * this.grid.size
                            });
                            this.itemsGroup.add(e),
                            e.body.setCollisionGroup(this.itemsCollisionGroup),
                            e.body.collides(this.playerCollisionGroup)
                        }
            }
            createMapData() {
                if (!this.currentGame)
                    throw new Error("Game data missing");
                const e = []
                  , t = this.currentGame.layerInfo.width
                  , i = this.currentGame.layerInfo.height
                  , s = this.currentGame.layerInfo.properties.wall
                  , r = this.currentGame.layerInfo.properties.balk;
                if (this.observer) {
                    const o = this.currentGame.shadowMap;
                    for (let a = 0; a < i; a++) {
                        e.push([]);
                        for (let i = 0; i < t; i++)
                            e[a][i] = 0,
                            o[a][i] === r ? e[a][i] = 2 : o[a][i] === s && (e[a][i] = 1)
                    }
                } else {
                    const o = this.currentGame.layerInfo.data;
                    let a = 0;
                    for (let n = 0; n < i; n++) {
                        e.push([]);
                        for (let i = 0; i < t; i++)
                            e[n][i] = 0,
                            o[a] === r ? e[n][i] = 2 : o[a] === s && (e[n][i] = 1),
                            a++
                    }
                }
                return e
            }
            createPlayers() {
                if (!this.currentGame)
                    throw new Error("Game data missing");
                for (const e of this.currentGame.players) {
                    const t = this.game.cache.checkBitmapDataKey(e.id) ? this.game.cache.getBitmapData(e.id) : "avatar28";
                    if (e.id === this.attendeeId)
                        this.observer ? this.player = void 0 : (this.player = new he({
                            emitter: this.emitter,
                            windowHandle: this.windowHandle,
                            game: this.game,
                            timers: this.timers,
                            id: e.id,
                            spawn: new c.a.Point(e.position.x,e.position.y),
                            name: e.name,
                            imageData: t,
                            grid: this.grid
                        }),
                        this.playerGroup.add(this.player),
                        this.player.body.setCollisionGroup(this.playerCollisionGroup),
                        this.player.body.collides([this.itemsCollisionGroup, this.spoilsCollisionGroup, this.fireBlastsCollisionGroup, this.bombsCollisionGroup, this.enemiesCollisionGroup], this.handlePlayerVsItemCollision, this));
                    else if (e.isAlive) {
                        const i = new pe({
                            game: this.game,
                            id: e.id,
                            spawn: new c.a.Point(e.position.x,e.position.y),
                            name: e.name,
                            imageData: t,
                            grid: this.grid
                        });
                        i.body.setCollisionGroup(this.enemiesCollisionGroup),
                        i.body.collides(this.playerCollisionGroup),
                        this.enemiesGroup.add(i)
                    } else
                        this.bonesGroup.add(new fe({
                            game: this.game,
                            col: e.position.x / n,
                            row: e.position.y / n
                        }))
                }
            }
            createCurrentSpoilsAndBombs() {
                if (!this.currentGame)
                    throw new Error("Game data missing");
                for (const e of this.currentGame.spoils)
                    this.spoilsGroup.add(new be({
                        game: this.game,
                        grid: this.grid,
                        id: e.id,
                        col: e.col,
                        row: e.row,
                        type: e.spoilType
                    }));
                for (const e of this.currentGame.bombs)
                    this.handleBombShow(ve({}, e))
            }
            setupPhysics() {
                this.game.physics.startSystem(c.a.Physics.P2JS),
                this.game.physics.p2.setImpactEvents(!0),
                this.game.physics.p2.updateBoundsCollisionGroup(),
                this.game.physics.p2.setPostBroadphaseCallback(this.handlePostBroadphase, this)
            }
            createCollisionGroups() {
                this.itemsCollisionGroup = this.game.physics.p2.createCollisionGroup(),
                this.bombsCollisionGroup = this.game.physics.p2.createCollisionGroup(),
                this.spoilsCollisionGroup = this.game.physics.p2.createCollisionGroup(),
                this.fireBlastsCollisionGroup = this.game.physics.p2.createCollisionGroup(),
                this.enemiesCollisionGroup = this.game.physics.p2.createCollisionGroup(),
                this.playerCollisionGroup = this.game.physics.p2.createCollisionGroup()
            }
            createObjectGroups() {
                this.background = this.game.add.group(),
                this.background.x = 16,
                this.background.y = 16,
                this.itemsGroup = this.game.add.physicsGroup(c.a.Physics.P2JS),
                this.itemsGroup.x = 16,
                this.itemsGroup.y = 16,
                this.bonesGroup = this.game.add.group(),
                this.bonesGroup.x = 16,
                this.bonesGroup.y = 16,
                this.bombsGroup = this.game.add.physicsGroup(c.a.Physics.P2JS),
                this.bombsGroup.x = 16,
                this.bombsGroup.y = 16,
                this.spoilsGroup = this.game.add.physicsGroup(c.a.Physics.P2JS),
                this.spoilsGroup.x = 16,
                this.spoilsGroup.y = 16,
                this.enemiesGroup = this.game.add.physicsGroup(c.a.Physics.P2JS),
                this.enemiesGroup.x = 16,
                this.enemiesGroup.y = 16,
                this.playerGroup = this.game.add.physicsGroup(c.a.Physics.P2JS),
                this.playerGroup.x = 16,
                this.playerGroup.y = 16,
                this.blastsGroup = this.game.add.physicsGroup(c.a.Physics.P2JS),
                this.blastsGroup.x = 16,
                this.blastsGroup.y = 16
            }
            handlePostBroadphase(e, t) {
                return e.sprite instanceof he && t.sprite instanceof ye ? (this.handlePlayerVsBlast(e.sprite, t.sprite),
                !1) : e.sprite instanceof ye && t.sprite instanceof he ? (this.handlePlayerVsBlast(t.sprite, e.sprite),
                !1) : !(e.sprite instanceof he && t.sprite instanceof me || e.sprite instanceof me && t.sprite instanceof he) || e.sprite.gridPos.x !== t.sprite.gridPos.x || e.sprite.gridPos.y !== t.sprite.gridPos.y
            }
            handlePlayerVsItemCollision(e, t) {
                if (t && t.sprite instanceof be) {
                    const e = t.sprite;
                    this.emitter.safeEmit("player-spoil-pick-up", {
                        spoilId: e.id
                    }),
                    e.kill()
                }
                e.setZeroVelocity(),
                e.setZeroRotation(),
                e.setZeroForce(),
                e.setZeroDamping(),
                e.rotation = 0,
                e.static = !0
            }
            handlePlayerVsBlast(e, t) {
                if (!e.alive)
                    return;
                const i = this.grid.screenToGrid(t.position.x, t.position.y);
                e.gridPos.x === i.x && e.gridPos.y === i.y && (this.emitter.safeEmit("player-dead", {
                    col: e.gridPos.x,
                    row: e.gridPos.y
                }),
                e.kill())
            }
            stopAnimationLoop() {
                if (this.enemiesGroup)
                    for (const e of this.enemiesGroup.children) {
                        const t = e;
                        t.lastMoveAt < this.game.time.now - 200 && t.animations.stop()
                    }
            }
        }
        function xe(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        Pe(Ge, "key", w.Play);
        class Se extends v {
            constructor() {
                super(...arguments),
                xe(this, "keys", new Map),
                xe(this, "name", void 0),
                xe(this, "handleKeyUp", (e => {
                    this.keys.set(e.key, !0)
                }
                ))
            }
            init(e) {
                let {attendeeId: t, emitter: i, logger: s, windowHandle: r, name: o} = e;
                super.init({
                    attendeeId: t,
                    emitter: i,
                    logger: s,
                    windowHandle: r
                }),
                this.name = o,
                this.windowHandle && (this.keys.clear(),
                this.windowHandle.addEventListener("keyup", this.handleKeyUp, {
                    capture: !0
                }))
            }
            create() {
                new Q({
                    game: this.game,
                    x: this.game.world.centerX,
                    y: this.game.world.centerY,
                    text: this.winnerText(),
                    style: {
                        font: "30px Arial",
                        fill: "#FFFFFF"
                    }
                })
            }
            update() {
                this.isKeyEnterPressed() && this.returnToMenu()
            }
            shutdown() {
                this.windowHandle && this.windowHandle.removeEventListener("keyup", this.handleKeyUp, {
                    capture: !0
                })
            }
            returnToMenu() {
                this.startState(w.Lobby, {
                    windowHandle: this.windowHandle
                })
            }
            winnerText() {
                return this.name ? 'Player "'.concat(this.name, '" won! Press Enter to start a new game.') : "You all died! Press Enter to start a new game."
            }
            isKeyEnterPressed() {
                return this.windowHandle ? this.keys.get("Enter") || !1 : this.game.input.keyboard.isDown(c.a.Keyboard.ENTER)
            }
        }
        xe(Se, "key", w.Win);
        class ke extends c.a.Game {
            constructor(e) {
                let {attendeeId: t, emitter: i, logger: s, parent: r, width: o, height: a, scale: n, windowHandle: l} = e;
                super({
                    width: o,
                    height: a,
                    renderer: c.a.AUTO,
                    parent: r,
                    transparent: !0
                }),
                this.state.add(G.key, G),
                this.state.add(Z.key, Z),
                this.state.add(ie.key, ie),
                this.state.add(Ge.key, Ge),
                this.state.add(Se.key, Se),
                this.state.start(G.key, !0, !1, {
                    attendeeId: t,
                    emitter: i,
                    logger: s,
                    scale: n,
                    parent: r,
                    windowHandle: l
                })
            }
            destroy() {
                const e = Object.values(this.state.states);
                for (const t of e)
                    t.gameWillClose();
                super.destroy()
            }
        }
        function Ce(e, t, i) {
            return (t = function(e) {
                var t = function(e, t) {
                    if ("object" != typeof e || null === e)
                        return e;
                    var i = e[Symbol.toPrimitive];
                    if (void 0 !== i) {
                        var s = i.call(e, t || "default");
                        if ("object" != typeof s)
                            return s;
                        throw new TypeError("@@toPrimitive must return a primitive value.")
                    }
                    return ("string" === t ? String : Number)(e)
                }(e, "string");
                return "symbol" == typeof t ? t : String(t)
            }(t))in e ? Object.defineProperty(e, t, {
                value: i,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = i,
            e
        }
        class Ee extends l.a {
            constructor(e) {
                let {id: t, attendeeId: i} = e;
                super(t),
                Ce(this, "attendeeId", void 0),
                Ce(this, "gameEmitter", void 0),
                Ce(this, "logger", void 0),
                Ce(this, "game", void 0),
                Ce(this, "windowHandle", void 0),
                Ce(this, "gameElement", void 0),
                s.r && (this.windowHandle = d.a.getWindow("roomCampfire")),
                this.gameElement = (this.windowHandle ? this.windowHandle.document : document).createElement("div"),
                this.attendeeId = i,
                this.logger = new r.a("webapp:bombermanGame[gameId:".concat(this.id, "]")),
                this.gameEmitter = new o.b,
                this.handleNotificationsToGame()
            }
            async startGame() {
                const e = this.gameElement.getBoundingClientRect();
                this.game = new ke({
                    attendeeId: this.attendeeId,
                    emitter: this.gameEmitter,
                    logger: this.logger,
                    parent: this.gameElement,
                    width: 896,
                    height: 576,
                    scale: m(e.width, e.height),
                    windowHandle: this.windowHandle
                })
            }
            getGameElement() {
                return this.gameElement
            }
            close() {
                this.game.destroy()
            }
            handleNotification(e, t) {
                this.logger.debug("handleNotification() [gameEvent:".concat(e, "]"));
                const i = this.game.state.getCurrentState();
                switch (i.key) {
                case w.Lobby:
                    {
                        const s = i;
                        switch (e) {
                        case "start-game-countdown":
                            s.handleStartGameCountdown(t);
                            break;
                        case "start-game":
                            s.handleStartGame(t);
                            break;
                        case "observe-game":
                            s.handleObserveGame(t);
                            break;
                        default:
                            throw new Error("Received unhandled notification for state ".concat(i.key))
                        }
                        break
                    }
                case w.Play:
                    {
                        const s = i;
                        switch (e) {
                        case "player-position-changed":
                            s.handlePlayerPositionChanged(t);
                            break;
                        case "bomb-show":
                            s.handleBombShow(t);
                            break;
                        case "bomb-detonate":
                            s.handleBombDetonate(t);
                            break;
                        case "spoil-destroy":
                            s.handleSpoilDestroy(t);
                            break;
                        case "spoil-picked-up":
                            s.handleSpoilPickedUp(t);
                            break;
                        case "bones-show":
                            s.handleBonesShow(t),
                            this.safeEmit("player-lost", t.playerId);
                            break;
                        case "player-left":
                            this.safeEmit("player-left", t.playerName);
                            break;
                        case "player-won":
                            this.safeEmit("player-won", t.playerId);
                            break;
                        case "timer-ended":
                            this.safeEmit("timer-ended");
                            break;
                        default:
                            throw new Error("Received unhandled notification for state ".concat(i.key))
                        }
                        break
                    }
                }
            }
            async handleRequest(e, t) {
                this.logger.debug("handleRequest() [gameEvent:".concat(e, "]"))
            }
            getShortInstructions() {
                return "Instructions: Use arrow keys to move around and your space bar to drop dynamite. But make sure to run away before the area you're in blows up!"
            }
            handleNotificationsToGame() {
                this.gameEmitter.on("enter-game", ( () => {
                    this.safeEmit("notify", "rdc", "enter-game", {})
                }
                )),
                this.gameEmitter.on("player-position-update", (e => {
                    this.safeEmit("notify", "rdc", "player-position-update", e)
                }
                )),
                this.gameEmitter.on("player-bomb-create", (e => {
                    this.safeEmit("notify", "rdc", "player-bomb-create", e)
                }
                )),
                this.gameEmitter.on("player-spoil-pick-up", (e => {
                    this.safeEmit("notify", "rdc", "player-spoil-pick-up", e)
                }
                )),
                this.gameEmitter.on("player-dead", (e => {
                    this.safeEmit("notify", "rdc", "player-dead", e)
                }
                ))
            }
        }
    },
    1294: function(e, t, i) {
        window.PIXI = i(1295),
        window.p2 = i(1296),
        window.Phaser = i(1297)
    }
}]);
//# sourceMappingURL=bombermanGameClient.cbad9ecb053bd5a29646.js.map
