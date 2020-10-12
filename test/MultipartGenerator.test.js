/* eslint-disable no-plusplus */
import { assert } from '@open-wc/testing';
import { MultipartGenerator } from '../src/MultipartGenerator.js';

describe('MultipartGenerator', () => {
  function createFormData() {
    const fd = new FormData();
    fd.append('test-image', new Blob(['.'], {type: 'image/jpg'}), 'test.jpg');
    fd.append('test-unknown-mime', new Blob(['.']));
    fd.append('test-text', 'test');
    return fd;
  }

  function hasAdvancedSupport() {
    try {
      const fd = new FormData();
      fd.append('test', new Blob(['.'], {type: 'image/jpg'}), 'test.jpg');
      return ('entries' in fd);
    } catch (e) {
      return false;
    }
  }

  const hasFormData = hasAdvancedSupport();

  describe('generateMessage()', () => {
    let element = /** @type MultipartGenerator */(null);
    beforeEach(async () => {
      element = new MultipartGenerator(createFormData());
    });

    (hasFormData ? it : it.skip)('creates ArrayBuffer', async () => {
      const message = await element.generateMessage();
      assert.typeOf(message, 'ArrayBuffer');
    });

    (hasFormData ? it : it.skip)('sets the contentType', async () => {
      await element.generateMessage();

      assert.typeOf(element.contentType, 'string');
    });

    (hasFormData ? it : it.skip)('sets the boundary', async () => {
      await element.generateMessage();
      assert.typeOf(element.boundary, 'string');
    });
  });

  describe('generatePreview()', () => {
    let element = /** @type MultipartGenerator */(null);
    beforeEach(async () => {
      element = new MultipartGenerator(createFormData());
    });

    it('rejects when no formData', async () => {
      element.form = undefined;
      let message;
      try {
        await element.generatePreview();
      } catch (e) {
        message = e.message;
      }
      assert.equal(message, 'The FormData property is not set.');
    });

    (hasFormData ? it : it.skip)('returns a string', async () => {
      const message = await element.generatePreview();
      assert.typeOf(message, 'string');
    });

    (hasFormData ? it : it.skip)('sets the contentType', async () => {
      await element.generatePreview();

      assert.typeOf(element.contentType, 'string');
    });

    (hasFormData ? it : it.skip)('sets the boundary', async () => {
      await element.generatePreview();
      assert.typeOf(element.boundary, 'string');
    });
  });

  describe('arrayBufferToString()', () => {
    let element = /** @type MultipartGenerator */(null);
    beforeEach(async () => {
      element = new MultipartGenerator(createFormData());
    });

    function getView(str) {
      const buf = new ArrayBuffer(str.length);
      const bufView = new Uint8Array(buf);
      for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return bufView;
    }

    function str2ab(str) {
      const buf = new ArrayBuffer(str.length);
      const bufView = new Uint8Array(buf);
      for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    }

    it('Coverts array buffer to string', () => {
      const ab = str2ab('test');
      const result = element.arrayBufferToString(ab);
      assert.equal(result, 'test');
    });

    it('Coverts Uint array to string', () => {
      const ab = getView('test');
      const result = element.arrayBufferToString(ab);
      assert.equal(result, 'test');
    });
  });
});