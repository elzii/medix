'use strict';

import {createAction} from 'Utils';
import {rpcClient} from '../../electrobun-rpc';
import {RedisProxy} from '../../redis-proxy';

function getIndex(getState) {
  const {activeInstanceKey, instances} = getState()
  return instances.findIndex(instance => instance.get('key') === activeInstanceKey)
}

export const updateConnectStatus = createAction('UPDATE_CONNECT_STATUS', status => ({getState, next}) => {
  next({status, index: getIndex(getState)})
})

export const disconnect = createAction('DISCONNECT', () => ({getState, next}) => {
  const {activeInstanceKey, instances} = getState()
  const instance = instances.find(inst => inst.get('key') === activeInstanceKey)
  if (instance) {
    const redis = instance.get('redis')
    if (redis && typeof redis.disconnect === 'function') {
      redis.disconnect()
    }
  }
  next({index: getIndex(getState)})
})

export const connectToRedis = createAction('CONNECT', config => async ({getState, dispatch, next}) => {
  dispatch(updateConnectStatus(config.ssh ? 'SSH connecting...' : 'Redis connecting...'))

  try {
    const res = await rpcClient.request.connectToRedis({config})
    if (!res.success) {
      dispatch(disconnect())
      alert(res.error || 'Failed to connect to Redis')
      return
    }

    const redis = new RedisProxy(res.instanceId, res.serverInfo)
    next({redis, config, index: getIndex(getState)})
  } catch (err) {
    dispatch(disconnect())
    alert(err.message || String(err))
  }
})
