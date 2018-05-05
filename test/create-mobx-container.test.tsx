import React from 'react';
import { shallow, mount } from 'enzyme';
import { observable } from 'mobx';
import { Provider } from 'mobx-react';
import createContainer from '../src/create-mobx-container';

describe('createStore', () => {
  it('is called when the component is created', () => {
    const Component = ({ store }) => <div />;

    const spy = jest.fn();

    const container = createContainer({
      createStore: spy
    });

    const EnhancedComponent = container(Component);

    const wrapper = mount(<EnhancedComponent />);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('is called with the props provided to the component as the first argument', () => {
    const Component = ({ store }) => <div />;

    const spy = jest.fn();

    const container = createContainer({
      createStore: spy
    });

    const EnhancedComponent = container(Component);

    const wrapper = mount(<EnhancedComponent a={1} b={2} />);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({
      a: 1,
      b: 2
    });
  });
});

describe('mapStoreToProps', () => {
  it('splats the result into props', () => {
    const Component = ({ a, b }) => <div />;

    const container = createContainer({
      mapStoreToProps: () => ({
        a: 1,
        b: 2
      })
    });

    const EnhancedComponent = container(Component);

    const wrapper = mount(<EnhancedComponent />);

    expect(wrapper.find(Component).props()).toEqual({
      a: 1,
      b: 2
    });
  });

  it('receives the result of createStore and the props as arguments', () => {
    class Store {
      @observable field = 1;
    }

    const Component = ({ store, a, b }) => <div />;

    const instance = new Store();

    const container = createContainer({
      createStore: () => instance,
      mapStoreToProps: (store, props: { a: number; b: number }) => ({
        b: props.b + 1,
        store
      })
    });

    const EnhancedComponent = container(Component);

    const wrapper = mount(<EnhancedComponent a={1} b={2} />);

    expect(wrapper.find(Component).props()).toEqual({
      a: 1,
      b: 3,
      store: instance
    });
  });
});

test('lifecycle', done => {
  const Component = ({ a }) => <div />;

  const lifecycleCalls = [];

  const container = createContainer<{ a: number }, {}, {}, {}>({
    createStore: () => lifecycleCalls.push('createStore'),
    initializeStore: () => lifecycleCalls.push('initializeStore'),
    mapStoreToProps: () => {
      lifecycleCalls.push('mapStoreToProps');
      return {};
    },
    onPropsChange: () => lifecycleCalls.push('onPropsChange'),
    beforeUpdate: () => lifecycleCalls.push('beforeUpdate'),
    onUpdate: () => lifecycleCalls.push('onUpdate'),
    destroyStore: () => lifecycleCalls.push('destroyStore')
  });

  const EnhancedComponent = container(Component);

  class Parent extends React.Component {
    state = {
      a: 1
    };

    constructor(props) {
      super(props);
      setTimeout(() => this.setState({ a: 2 }));
    }

    render() {
      return <EnhancedComponent a={this.state.a} />;
    }
  }

  expect(lifecycleCalls.length).toBe(0);

  const wrapper = mount(<Parent />);

  expect(lifecycleCalls.length).toBe(4);
  expect(lifecycleCalls).toEqual([
    'createStore',
    'onPropsChange',
    'mapStoreToProps',
    'initializeStore'
  ]);

  setTimeout(() => {
    expect(lifecycleCalls).toEqual([
      'createStore',
      'onPropsChange',
      'mapStoreToProps',
      'initializeStore',
      'onPropsChange',
      'beforeUpdate',
      'mapStoreToProps',
      'onUpdate'
    ]);
    done();
  }, 10);
});
