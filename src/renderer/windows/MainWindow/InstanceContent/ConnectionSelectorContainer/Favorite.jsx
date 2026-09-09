'use strict'

import React from 'react'
import Sortable from 'sortablejs'
import {LightningIcon, ServerIcon, PlusIcon, CloseIcon} from 'Icons'

class Favorite extends React.PureComponent {
  constructor() {
    super()
    this.state = {
      activeKey: null
    }
    this._updateSortableKey()
  }

  _updateSortableKey() {
    this.sortableKey = `sortable-${Math.round(Math.random() * 10000)}`
  }

  _bindSortable() {
    const {reorderFavorites} = this.props

    this.sortable = Sortable.create(this.refs.sortable, {
      animation: 100,
      onStart: evt => {
        this.nextSibling = evt.item.nextElementSibling
      },
      onAdd: () => {
        this._updateSortableKey()
      },
      onUpdate: evt => {
        this._updateSortableKey()
        reorderFavorites({from: evt.oldIndex, to: evt.newIndex})
      }
    })
  }

  componentDidMount() {
    this._bindSortable()
  }

  componentDidUpdate() {
    this._bindSortable()
  }

  onClick(index, evt) {
    evt.preventDefault()
    this.selectIndex(index)
  }

  onDoubleClick(index, evt) {
    evt.preventDefault()
    this.selectIndex(index, true)
  }

  selectIndex(index, connect) {
    this.select(index === -1 ? null : this.props.favorites.get(index), connect)
  }

  select(favorite, connect) {
    const activeKey = favorite ? favorite.get('key') : null
    this.setState({activeKey})
    if (connect) {
      this.props.onRequireConnecting(activeKey)
    } else {
      this.props.onSelect(activeKey)
    }
  }

  render() {
    return (<div style={{flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'hidden'}}>
      <nav className="nav-group">
        <h5 className="nav-group-title"/>
        <a
          className={'nav-group-item' + (this.state.activeKey ? '' : ' active')}
          onClick={this.onClick.bind(this, -1)}
          onDoubleClick={this.onDoubleClick.bind(this, -1)}
          >
          <LightningIcon size={14} color="#ffd60a" style={{marginRight: 6}} />
          QUICK CONNECT
        </a>
        <h5 className="nav-group-title">FAVORITES</h5>
        <div ref="sortable" key={this.sortableKey}>{
          this.props.favorites.map((favorite, index) => {
            return (<a
              key={favorite.get('key')}
              className={'nav-group-item' + (favorite.get('key') === this.state.activeKey ? ' active' : '')}
              onClick={this.onClick.bind(this, index)}
              onDoubleClick={this.onDoubleClick.bind(this, index)}
              >
              <ServerIcon size={14} color="currentColor" style={{marginRight: 6}} />
              <span>{favorite.get('name')}</span>
            </a>)
          })
        }</div>
      </nav>
      <footer className="toolbar toolbar-footer">
        <button
          onClick={() => {
            this.props.createFavorite()
          // TODO: auto select
          // this.select(favorite);
          }}
          title="Add bookmark"
          style={{padding: '2px 8px', display: 'inline-flex', alignItems: 'center'}}
          ><PlusIcon size={10} /></button>
        <button
          onClick={
          () => {
            const key = this.state.activeKey
            if (!key) {
              return
            }
            showModal({
              title: 'Delete the bookmark?',
              button: 'Delete',
              content: 'Are you sure you want to delete the selected bookmark? This action cannot be undone.'
            }).then(() => {
              const index = this.props.favorites.findIndex(favorite => key === favorite.get('key'))
              this.props.removeFavorite(key)
              this.selectIndex(index - 1)
            })
          }
        }
          title="Delete bookmark"
          style={{padding: '2px 8px', display: 'inline-flex', alignItems: 'center', marginLeft: 4}}
          ><CloseIcon size={10} /></button>
      </footer>
    </div>)
  }

  componentWillUnmount() {
    this.sortable.destroy()
  }
}

export default Favorite
