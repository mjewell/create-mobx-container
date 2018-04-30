import { observer, Provider, PropTypes } from 'mobx-react';
import React, { Component, ComponentType } from 'react';

export type CreateContainerArgs<PropsIn, PropsOut, Store, ContextStores> = {
  createStore: (props: PropsIn, contextStores: ContextStores) => Store;
  mapStoreToProps?: (
    store: Store,
    props: PropsIn,
    contextStores: ContextStores
  ) => Partial<PropsOut>;
  onPropsChange?: (store: Store, props: PropsIn, contextStores: ContextStores) => void;
  onDestroy?: (store: Store, props: PropsIn, contextStores: ContextStores) => void;
  contextName?: string;
};

export default function createContainer<PropsIn, PropsOut, Store, ContextStores>({
  createStore = (props: PropsIn, contextStores: ContextStores) => null,
  mapStoreToProps = () => ({}),
  onPropsChange = () => null,
  onDestroy = () => null,
  contextName
}: CreateContainerArgs<PropsIn, PropsOut, Store, ContextStores>) {
  return (WrappedComponent: ComponentType): any => {
    const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name;

    class Container extends Component<PropsIn, { store: Store }> {
      static readonly displayName = `${wrappedComponentName}Container`;
      static readonly contextTypes = {
        mobxStores: PropTypes.objectOrObservableObject
      };

      constructor(props: PropsIn, context: { mobxStores: ContextStores }) {
        super(props, context);

        this.state = {
          store: createStore(props, context.mobxStores) as Store
        };

        onPropsChange(this.state.store, props, context.mobxStores);
      }

      componentWillReceiveProps(newProps: PropsIn) {
        onPropsChange(this.state.store, newProps, this.context.mobxStores);
      }

      componentWillUnmount() {
        onDestroy(this.state.store, this.props, this.context.mobxStores);
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
