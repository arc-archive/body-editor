import { css } from 'lit-element';

export default css`
:host {
  display: flex;
  flex-direction: column;
  min-height: 300px;
  position: relative;
}

#container {
  width: 100%;
  height: 100%;
  flex: 1;
  position: relative;
}

.editors {
  display: flex;
  min-height: inherit;
  height: inherit;
}

.monaco-wrapper,
.message-wrapper {
  flex: 1;
  min-height: inherit;
  height: inherit;
}

.message-wrapper {
  margin-left: 12px;
}

.type-selector {
  margin: 0;
}

`;