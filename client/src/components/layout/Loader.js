import React, { Fragment } from 'react';
import Spinner from './Spinner.gif';

const Loader = () => {
  return (
    <Fragment>
      <img
        src={Spinner}
        style={{ width: '200px', margin: 'auto', display: 'block' }}
        alt='Loading...'
      />
    </Fragment>
  );
};

export default Loader;
