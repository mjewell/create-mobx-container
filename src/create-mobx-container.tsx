import { observer, Provider, PropTypes } from 'mobx-react';
import { reaction, IReactionDisposer } from 'mobx';
import React, { Component, ComponentType } from 'react';

export type CreateContainerArgs<PropsIn, PropsOut, Store, Snapshot> = {
  createStore?: (props: PropsIn) => Store;
  initializeStore?: (store: Store, props: PropsIn) => void;
  mapStoreToProps?: (store: Store, props: PropsIn) => Partial<PropsOut>;
  onPropsChange?: (store: Store, nextProps: PropsIn) => void;
  beforeUpdate?: (store: Store, nextProps: PropsIn, props: PropsIn) => Snapshot;
  onUpdate?: (store: Store, props: PropsIn, prevProps: PropsIn, snapshot: Snapshot) => void;
  destroyStore?: (store: Store, props: PropsIn) => void;
  contextName?: string;
};

export default function createContainer<PropsIn, PropsOut, Store, Snapshot>({
  createStore = (props: PropsIn) => null,
  initializeStore = () => null,
  mapStoreToProps = (store: Store, props: PropsIn) => ({}),
  onPropsChange = () => null,
  beforeUpdate = (store: Store, nextProps: PropsIn, props: PropsIn) => null,
  onUpdate = () => null,
  destroyStore = () => null,
  contextName
}: CreateContainerArgs<PropsIn, PropsOut, Store, Snapshot>) {
  return (WrappedComponent: ComponentType<PropsIn & PropsOut>): ComponentType<PropsIn> => {
    type State = {
      store: Store;
    };
    const wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name;

    class Container extends Component<PropsIn, State> {
      static readonly displayName = `${wrappedComponentName}Container`;
      snapshot?: Snapshot;

      constructor(props: PropsIn) {
        super(props);

        this.state = {
          store: createStore(props)!
        };

        onPropsChange(this.state.store, props);
      }

      // only get nextProps and not this.props to match behaviour of getDerivedStateFromProps
      componentWillReceiveProps(nextProps: PropsIn) {
        onPropsChange(this.state.store, nextProps);
      }

      // componentWillUnmount is guaranteed to be paired with this
      // we should set up anything that needs to be torn down here
      // instead of relying on createStore
      componentDidMount() {
        initializeStore(this.state.store, this.props);
      }

      // save snapshot for componentDidUpdate to match behaviour of getSnapshotBeforeUpdate
      componentWillUpdate(nextProps: PropsIn) {
        this.snapshot = beforeUpdate(this.state.store, nextProps, this.props)!;
      }

      componentDidUpdate(prevProps: PropsIn) {
        onUpdate(this.state.store, this.props, prevProps, this.snapshot!);
      }

      componentWillUnmount() {
        destroyStore(this.state.store, this.props);
      }

      render() {
        const props = {
          ...(this.props as any),
          ...(mapStoreToProps(this.state.store, this.props) as any)
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
