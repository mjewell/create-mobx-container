import { observer, Provider, PropTypes } from 'mobx-react';
import { reaction, IReactionDisposer } from 'mobx';
import React, { Component, ComponentType } from 'react';

export const SKIP_RERENDER = 'SKIP_RERENDER';

export type CreateContainerArgs<PropsIn, PropsOut, Store, ContextStores> = {
  createStore?: (props: PropsIn, contextStores: ContextStores) => Store;
  initializeStore?: (store: Store, props: PropsIn, contextStores: ContextStores) => void;
  mapStoreToProps?: (
    store: Store,
    props: PropsIn,
    contextStores: ContextStores
  ) => Partial<PropsOut>;
  onPropsChange?: (store: Store, props: PropsIn) => void;
  mapContextStoresToState?: (contextStore: ContextStores) => any;
  onContextStoresChange?: (store: Store, newState: any) => void | 'SKIP_RERENDER';
  destroyStore?: (store: Store, props: PropsIn, contextStores: ContextStores) => void;
  contextName?: string;
};

export default function createContainer<PropsIn, PropsOut, Store, ContextStores>({
  createStore = (props: PropsIn, contextStores: ContextStores) => null,
  initializeStore = () => null,
  mapStoreToProps = () => ({}),
  onPropsChange = () => null,
  mapContextStoresToState = () => ({}),
  onContextStoresChange = () => SKIP_RERENDER,
  destroyStore = () => null,
  contextName
}: CreateContainerArgs<PropsIn, PropsOut, Store, ContextStores>) {
  return (WrappedComponent: ComponentType<PropsIn & PropsOut>): ComponentType<PropsIn> => {
    type State = {
      store: Store;
      triggerState: boolean;
    };
    const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name;

    class Container extends Component<PropsIn, State> {
      static readonly displayName = `${wrappedComponentName}Container`;
      static readonly contextTypes = {
        mobxStores: PropTypes.objectOrObservableObject
      };

      mobxStoresReactionDisposer?: IReactionDisposer;

      constructor(props: PropsIn, context: { mobxStores: ContextStores }) {
        super(props, context);

        this.state = {
          store: createStore(props, context.mobxStores) as Store,
          triggerState: false
        };

        onContextStoresChange(this.state.store, mapContextStoresToState(context.mobxStores));
        onPropsChange(this.state.store, props);
      }

      componentWillReceiveProps(nextProps: PropsIn) {
        onPropsChange(this.state.store, nextProps);
      }

      // componentWillUnmount is guaranteed to be paired with this
      // we should set up anything that needs to be torn down here
      // instead of relying on createStore
      componentDidMount() {
        initializeStore(this.state.store, this.props, this.context.mobxStores);

        this.mobxStoresReactionDisposer = reaction(
          () => mapContextStoresToState(this.context.mobxStores),
          state => {
            const skipRerender = onContextStoresChange(this.state.store, state);

            if (skipRerender === SKIP_RERENDER) {
              return;
            }

            this.setState({
              triggerState: !this.state.triggerState
            });
          }
        );
      }

      componentWillUnmount() {
        this.mobxStoresReactionDisposer!();
        destroyStore(this.state.store, this.props, this.context.mobxStores);
      }

      render() {
        const props = {
          ...(this.props as any),
          ...(mapStoreToProps(this.state.store, this.props, this.context.mobxStores) as any)
        };

        const wrappedComponent = <WrappedComponent {...props} />;

        if (contextName) {
          const providerProps = {
            [contextName]: this.state.store
          };

          return <Provider {...providerProps}>{wrappedComponent}</Provider>;
        }

        return wrappedComponent;
      }
    }

    return observer(Container);
  };
}
