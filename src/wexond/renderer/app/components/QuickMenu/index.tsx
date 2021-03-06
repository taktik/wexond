import * as React from 'react';
import { observer } from 'mobx-react';
import { Section, Actions } from '../Overlay/style';
import { preventHiding, Header } from '../Overlay';
import { Bubble } from '../Bubble';
import { icons } from '../../constants';
import store from '../../store';
import { Line } from './style';
import { darkTheme, lightTheme } from '~/renderer/constants/themes';
import { translate } from '~/renderer/app/utils/translate';
import { getCurrentWindow } from '../../utils';
import { ipcRenderer } from 'electron';

const changeContent = (content: 'history' | 'default' | 'bookmarks') => () => {
  store.overlay.currentContent = content;
};

const onFindClick = () => {
  store.overlay.visible = false;

  store.tabs.selectedTab.findVisible = true;

  setTimeout(() => {
    store.tabs.selectedTab.findVisible = true;
  }, 200);
};

const onCleanClick = () => {
  store.history.clear();
  ipcRenderer.send('clear-browsing-data');
};
const onDarkClick = () => {
  store.settings.isDarkTheme = !store.settings.isDarkTheme;
  store.theme = store.settings.isDarkTheme ? darkTheme : lightTheme;
  store.saveSettings();
};

const onShieldClick = () => {
  store.settings.isShieldToggled = !store.settings.isShieldToggled;
  store.saveSettings();
  ipcRenderer.send('shield-toggle', store.settings.isShieldToggled);
};

const onAlwaysClick = () => {
  store.isAlwaysOnTop = !store.isAlwaysOnTop;
  getCurrentWindow().setAlwaysOnTop(store.isAlwaysOnTop);
};

export const QuickMenu = observer(() => {
  const invert = store.theme['overlay.foreground'] === 'light';
  return (
    <Section
      onClick={preventHiding}
      style={{
        display: 'flex',
        flexFlow: 'column',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <Actions>
        <Bubble
          toggled={store.isAlwaysOnTop}
          onClick={onAlwaysClick}
          invert={invert}
          icon={icons.window}
        >
          {translate('Always on top')}
        </Bubble>
        <Bubble
          toggled={store.settings.isDarkTheme}
          onClick={onDarkClick}
          invert={invert}
          icon={icons.night}
        >
          {translate('Dark mode')}
        </Bubble>
        <Bubble
          invert={invert}
          toggled={store.settings.isShieldToggled}
          icon={icons.shield}
          onClick={onShieldClick}
        >
          {translate('Shield')}
        </Bubble>
      </Actions>
      <Line />
      <Actions>
        <Bubble
          onClick={changeContent('history')}
          invert={invert}
          icon={icons.history}
        >
          {translate('History')}
        </Bubble>
        <Bubble
          onClick={changeContent('bookmarks')}
          invert={invert}
          icon={icons.bookmarks}
        >
          {translate('Bookmarks')}
        </Bubble>
        <Bubble
          invert={invert}
          onClick={onCleanClick}
          icon={icons.clean}>
          {translate('Clean')}
        </Bubble>
      </Actions>

    </Section>
  );
});
