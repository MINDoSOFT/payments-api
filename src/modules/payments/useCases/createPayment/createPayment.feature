Feature: Create payment

    Scenario: Creating a payment
        Given I provide valid payment details
        When I attempt to create a payment
        Then the payment should be saved successfully

    Scenario: Invalid payment details
        Given I provide invalid payment details
        When I attempt to create a payment
        Then I should get an invalid payment details error
