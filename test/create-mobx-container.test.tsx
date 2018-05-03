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
    expect(spy).toHaveBeenCalledWith(
      {
        a: 1,
        b: 2
      },
      undefined
    );
  });

  it('is called with the provided stores as the second argument', () => {
    const Component = ({ store }) => <div />;

    const spy = jest.fn();

    const container = createContainer({
      createStore: spy
    });

    const EnhancedComponent = container(Component);

    const wrapper = mount(
      <Provider x={1} y={2}>
        <EnhancedComponent a={1} b={2} />
      </Provider>
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      {
        a: 1,
        b: 2
      },
      {
        x: 1,
        y: 2
      }
    );
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

  it('receives the result of createStore as the first argument', () => {
    class Store {
      @observable field = 1;
    }

    const Component = ({ store }) => <div />;

    const instance = new Store();

    const container = createContainer({
      createStore: () => instance,
      mapStoreToProps: store => ({
        store
      })
    });

    const EnhancedComponent = container(Component);

    const wrapper = mount(<EnhancedComponent />);

    expect(wrapper.find(Component).props()).toEqual({
      store: instance
    });
  });
});

test('lifecycle', () => {
  const Component = () => <div />;

  const container = createContainer({
    createStore: () => console.log('createStore'),
    initializeStore: () => console.log('initializeStore'),
    mapStoreToProps: () => console.log('mapStoreToProps'),
    onPropsChange: () => console.log('onPropsChange'),
    mapContextStoresToState: () => console.log('mapContextStoresToState'),
    onContextStoresChange: () => console.log('onContextStoresChange'),
    destroyStore: () => console.log('destroyStore')
  });

  const EnhancedComponent = container(Component);

  const wrapper = mount(<EnhancedComponent />);
});
