import { observer } from 'mobx-react'
import * as React from 'react'

import store from '~/renderer/app/store'
import { StyledToolbar, Buttons, Separator } from './style'
import { NavigationButtons } from '../NavigationButtons'
import { Tabbar } from '../Tabbar'
import ToolbarButton from '../ToolbarButton'
import { icons, TOOLBAR_ICON_HEIGHT } from '../../constants'
import { ipcRenderer } from 'electron'
import BrowserAction from '../BrowserAction'
import { Find } from '../Find'
import { backToFlowr } from '~/renderer/app/utils'
import { VirtualKeyboardEvent } from '../../../../../keyboard/events'
import { Toolbar } from '../../models/toolbar'

const onUpdateClick = () => {
  ipcRenderer.send('update-install')
}

@observer
class BrowserActions extends React.Component {
  public render() {
    const { selectedTabId } = store.tabGroups.currentGroup

    return (
      <>
        {selectedTabId &&
          store.extensions.browserActions.map(item => {
            if (item.tabId === selectedTabId) {
              return <BrowserAction data={item} key={item.extensionId} />
            }
            return null
          })}
      </>
    )
  }
}

export default observer((data: Toolbar) => {
  const { selectedTab } = store.tabs

  const isWindow = true // false
  let blockedAds: any = ''

  if (selectedTab) {
    blockedAds = selectedTab.blockedAds
  }

  const onHomePress = () => {
    backToFlowr()
  }

  const onKeyboardPress = () => {
    ipcRenderer.send(VirtualKeyboardEvent.TOGGLE)
  }

  return (
      <StyledToolbar isHTMLFullscreen={store.isHTMLFullscreen}>
        <NavigationButtons />
        {!data.disableTabs && (
          <>
            <Tabbar />
            <Find />
          </>
        )}
        <Buttons>
          <BrowserActions />
          {store.updateInfo.available && (
            <ToolbarButton icon={icons.download} onClick={onUpdateClick} />
          )}
          {store.extensions.browserActions.length > 0 && <Separator />}
          {!isWindow && (
            <BrowserAction
              size={18}
              style={{ marginLeft: 0 }}
              opacity={0.54}
              data={{
                badgeBackgroundColor: 'gray',
                badgeText: blockedAds > 0 ? blockedAds.toString() : '',
                icon: icons.shield,
                badgeTextColor: 'white',
              }}
            />
          )}
          <ToolbarButton
            disabled={false}
            size={TOOLBAR_ICON_HEIGHT}
            icon={icons.home}
            onClick={onHomePress}
          />
          {data.enableVirtualKeyboard && <ToolbarButton
            disabled={false}
            size={TOOLBAR_ICON_HEIGHT}
            icon={icons.keyboard}
            onClick={onKeyboardPress}
          />}
        </Buttons>
      </StyledToolbar>
  )
})
