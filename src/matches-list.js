'use strict'

const blessed = require('blessed');
const fs = require('fs-extra');
const _ = require('lodash');
const Utils = require('./utils');
const ActionsList = require('./actions-list');

const defaultConfig = {
    keys: true,
    fg: 'white',
    selectedFg: 'white',
    selectedBg: 'blue',
    label: 'Matches',
    width: '75%',
    height: '100%',
    border: {type: "line", fg: "cyan"},
    columnSpacing: 10, //in chars,
    columnWidth: [16, 12, 12] /*in chars*/
};

function mapMatches(matches) {
    return matches.map(match => {
        return {
            match: match,
            type: fs.stat(match).then(function (res) {
                if (res.isFile()) {
                    return 'file';
                } else if (res.isDirectory()) {
                    return 'directory';
                } else if (res.isSymbolicLink()) {
                    return 'link';
                } else {
                    return 'other';
                }
            })
        };
    });
}

/**
 * Class depicting a list of file system matches
 */
class MatchesList extends blessed.list {
    constructor(screen, matches, config) {
        config = _.merge({}, defaultConfig, config || {});
        super(config);
        this.config = config;
        this.screen = screen;
        this.matches = matches;
        this.matchesData = mapMatches(matches);
        this.actionsList = null;
        // Set list, bind watchers, and display
        this.setItems(matches);
        this.on('select', this.selectMatch);
        this.key('right', this.selectMatch);
        this.key('left', Utils.quit);
        this.focus();
        this.screen.render();
    }

    appendMatches(matches) {
        this.spliceItem(this.matches.length, 0, ...matches);
        this.matches = this.matches.concat(matches);
        this.matchesData = this.matchesData.concat(mapMatches(matches));
        this.screen.render();
    }

    getSelectedMatch() {
        return this.matchesData[this.selected];
    }

    async getSelectedMatchType() {
        return await this.getSelectedMatch().type;
    }

    onActionListCancel() {
        this.actionsList = null;
        this.focus();
    }

    async selectMatch() {
        this.actionsList = new ActionsList(
            this.screen,
            this.getSelectedMatch().match,
            await this.getSelectedMatchType(),
            this.onActionListCancel.bind(this),
            { parent: this.config.parent }
        );
    }
}

module.exports = MatchesList;