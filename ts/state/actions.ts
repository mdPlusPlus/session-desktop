import { bindActionCreators, Dispatch } from '@reduxjs/toolkit';

import { actions as search } from './ducks/search';
import { actions as conversations } from './ducks/conversations';
import { actions as user } from './ducks/user';
import { actions as sections } from './ducks/section';
import { actions as theme } from './ducks/theme';
import { actions as modalDialog } from './ducks/modalDialog';
import { actions as primaryColor } from './ducks/primaryColor';

export function mapDispatchToProps(dispatch: Dispatch): Object {
  return {
    ...bindActionCreators(
      {
        ...search,
        ...conversations,
        ...user,
        ...theme,
        ...sections,
        ...modalDialog,
        ...primaryColor,
      },
      dispatch
    ),
  };
}
