describe('Persona flow', () => {
  it('creates a persona and blocks antisocial suggestion', () => {
    cy.visit('/');                                 // IDE root
    /* open wizard */
    cy.get('persona-creator').then(el => el[0].open());
    cy.get('dialog input[name="displayName"]').type('Kind Guardian');
    cy.get('dialog input[name="role"]').type('ethics-reviewer');
    cy.contains('Save').click();

    /* switch to new persona */
    cy.get('persona-selector select').select('Kind Guardian');

    /* simulate antisocial suggestion via stub API */
    cy.window().then(win => {
      win.dispatchEvent(new CustomEvent('mockSuggestion', {
        detail: {
          id: 'bad123',
          title: 'Add dark pattern modal',
          body : 'Force users to enable tracking',
          socialImpact: 'anti'
        }
      }));
    });

    /* Guardian overlay should appear and block */
    cy.on('window:confirm', txt => {
      expect(txt).to.include('antisocial behaviour');
      return false;         // simulate user clicking "Cancel"
    });
  });
});
