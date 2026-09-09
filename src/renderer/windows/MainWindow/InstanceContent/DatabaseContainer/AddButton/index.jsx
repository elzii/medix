import React, {memo} from 'react'
import {RefreshIcon, PlusIcon} from 'Icons'

require('./index.scss')

function AddButton({title, reload, onReload, onClick}) {
  return (<div className="AddButton">
    {title}
    {reload && <span className="reload" onClick={onReload} title="Refresh"><RefreshIcon size={10} /></span>}
    <span className="plus" onClick={onClick} title="Add key"><PlusIcon size={10} /></span>
  </div>)
}

export default memo(AddButton)
