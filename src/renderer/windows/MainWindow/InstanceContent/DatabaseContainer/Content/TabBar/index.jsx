'use strict'

import React, {memo} from 'react'
import {DocumentIcon, TerminalIcon, GearIcon} from 'Icons'
require('./index.scss')

const TABS = ['Content', 'Terminal', 'Config']

function renderTabIcon(tab) {
  switch (tab) {
    case 'Content':
      return <DocumentIcon size={13} style={{marginRight: 6}} />
    case 'Terminal':
      return <TerminalIcon size={13} style={{marginRight: 6}} />
    case 'Config':
      return <GearIcon size={13} style={{marginRight: 6}} />
  }
}

function renderTab(tab, {activeTab, onSelectTab}) {
  return <div
    className={'item' + (tab === activeTab ? ' is-active' : '')}
    key={tab}
    onClick={() => onSelectTab(tab)}
  >
    {renderTabIcon(tab)}
    {tab}
  </div>
}

function Content(props) {
  return <div className="TabBar">{TABS.map(tab => renderTab(tab, props))}</div>
}

export default memo(Content)
