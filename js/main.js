---
---

(function() {

    let page = document.querySelector(".parallax-page");
    let win = page;

    if (!page || window.getComputedStyle(page).getPropertyValue("perspective") == "none") {
        page = document.body;
        win = window;
    }

/*
 * General-purpose functions
 */

    const toArray = function (collection) {
        return Array.prototype.slice.call(collection);
    }

    const getTransitionTime = function (element, ...properties) {
        let dur = 0;
        const transition = window.getComputedStyle(element).getPropertyValue("transition").split(", ");
        if (properties.length > 0) {
            properties.forEach( function (property) {
                transition.forEach( function (transitionSet) {
                    let propertyMatch = new RegExp("(\\s|^)" + property + "(\\s|$)");
                    if (transitionSet.search(propertyMatch) >= 0) {
                        transitionSet.split(" ").forEach( function (value) {
                            if (value.search(/\ds$/) >= 0) {
                                const seconds = Number(value.replace("s", ""));
                                dur += seconds;
                            }
                        });
                    }
                });
            });
        } else {
            let durElement, durSet = [];
            transition.forEach( function (transitionSet) {
                durElement = 0;
                transitionSet.split(" ").forEach( function (value) {
                    if (value.search(/\ds$/) >= 0) {
                        const seconds = Number(value.replace("s", ""));
                        durElement += seconds;
                    }
                });
                durSet.push(durElement);
            });
            dur = Math.max.apply(null, durSet);
        }
        return dur * 1000;
    }

    const scrollBottom = function (element) { //opposite of .scrollTop: measures dist between bottom of view and bottom of element
        const elementBottom = element.scrollHeight;
        const viewBottom = element.scrollTop + element.clientHeight;
        return elementBottom - viewBottom;
    }

    const pagePos = function (element) {
        let posTop = element.getBoundingClientRect().top + page.scrollTop;
        let posLeft = element.getBoundingClientRect().left + page.scrollLeft;
        return { top: posTop, left: posLeft }
    }

    const getParentBySelector = function (element, selector) {
        let ancestor = element;
        while (ancestor != document.body) {
            ancestor = ancestor.parentElement;
            if (Sizzle.matchesSelector(ancestor, selector)) {
                return ancestor;
            }
        }
        return null;
    }

    const getChildBySelector = function (element, selector) {
        for (var i = 0; i < element.children.length; i++) {
            const child = element.children[i];
            if (Sizzle.matchesSelector(child, selector)) {
                return child;
            } else if (child.children.length) {
                const childMatch = getChildBySelector(child, selector);
                if (childMatch) {return childMatch;}
            }
        }
        return null;
    }

    const getChildrenBySelector = function (element, selector) {
        let matches = [];
        for (var i = 0; i < element.children.length; i++) {
            const child = element.children[i];
            if (Sizzle.matchesSelector(child, selector)) {
                matches.push(child);
            }
            if (child.children.length) {
                const childMatch = getChildrenBySelector(child, selector);
                if (childMatch) {
                    childMatch.forEach( function (match) {
                        matches.push(match);
                    });
                }
            }
        }
        if (matches.length) {
            return matches;
        } else {
            return null;
        }
    }

    const clearClass = function (string) {
        let className;
        if (string.charAt(0) === ".") {
            className = string.slice(1);
        } else {
            className = string;
        }
        const allOfClass = toArray(document.querySelectorAll("." + className));
        allOfClass.forEach( function (element) {
            element.classList.remove(className);
        });
    }

    const contentWidth = function (element) {
        const elementStyle = window.getComputedStyle(element);
        const elementPadding = parseInt(elementStyle.getPropertyValue("padding-left")) + parseInt(elementStyle.getPropertyValue("padding-right"));
        return element.clientWidth - elementPadding;
    }

    const contentHeight = function (element) {
        const elementStyle = window.getComputedStyle(element);
        const elementPadding = parseInt(elementStyle.getPropertyValue("padding-top")) + parseInt(elementStyle.getPropertyValue("padding-bottom"));
        return element.clientHeight - elementPadding;
    }

    const marginWidth = function (element) {
        const elementStyle = window.getComputedStyle(element);
        const elementMargin = parseInt(elementStyle.getPropertyValue("margin-left")) + parseInt(elementStyle.getPropertyValue("margin-right"));
        return element.clientWidth + elementMargin;
    }

    const marginHeight = function (element) {
        const elementStyle = window.getComputedStyle(element);
        const elementMargin = parseInt(elementStyle.getPropertyValue("margin-top")) + parseInt(elementStyle.getPropertyValue("margin-bottom"));
        return element.clientHeight + elementMargin;
    }

    const parseBoolean = function (string) {
        if (string == "true") {
            return true;
        } else {
            return false;
        }
    }

/*
 * Scrolling
 */

    const pageScrollBehavior = window.getComputedStyle(page).getPropertyValue("scroll-behavior");
    const smoothLinks = toArray(document.querySelectorAll('[data-scroll="smooth"]'));

    const pageScroller = zenscroll.createScroller(page, 999, 0);

    const getHash = function (element) { //should remove, not using
        const elementClass = Object.prototype.toString.call(element);
        if (elementClass == "[object SVGAElement]") {
            const link = element.href.baseVal;
            return link.slice(link.search("#"));
        } else if (elementClass == "[object HTMLAnchorElement]") {
            return element.hash;
        } else {
            return null;
        }
    }

    const smoothScrollTo = function (element, dur = null, offset = null) {
        pageScroller.toY(pagePos(element).top, dur, offset);
    }

    const smoothScrollToHref = function (link) {
        const hash = link.hash;
        const target = document.querySelector(hash);
        window.history.pushState({ hasFocus: hash }, hash.slice(1), hash);
        smoothScrollTo(target);
    }

/*
 * Fullscreen
 */

    const fullscreenElements = toArray(document.querySelectorAll('[data-script="force-fullscreen"]'));

    const forceFullscreen = function (element) {
        const viewHeight = window.innerHeight;
        if (element.clientHeight != viewHeight) {
            element.style.height = viewHeight.toString() + "px";
        }
    }

    const forceFullscreenAll = function () {
        fullscreenElements.forEach( function (element) {
            forceFullscreen(element);
        });
    }

/*
 * Event Listeners
 */

    const addSmoothScrollListeners = function () {
        if (pageScrollBehavior == "smooth") {return false};
        smoothLinks.forEach( function (link) {
            link.addEventListener("click", function (event) {
                event.preventDefault();
                smoothScrollToHref(link);
            });
        });
    }

    const addPopStateListener = function () {
        window.addEventListener("popstate", function () {
            if (event.state) {
                const target = document.querySelector(event.state.hasFocus);
                smoothScrollTo(target);
            } else {
                pageScroller.toY(0);
            }
        }, { passive: true });
    }

    const addOrientationChangeListener = function () {
        let initOrientation = window.innerHeight > window.innerWidth;
        if (fullscreenElements.length > 0) {
            window.addEventListener("resize", function () {
                const newOrientation = window.innerHeight > window.innerWidth;
                if (newOrientation != initOrientation) {
                    forceFullscreenAll();
                }
                initOrientation = newOrientation;
            });
        }
    }

    addSmoothScrollListeners();
    addPopStateListener();
    // addOrientationChangeListener();

    window.onload = function () {
        // forceFullscreenAll();
    }

})();
