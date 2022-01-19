Feature: Get payment

    Scenario: Getting a payment
        Given I provide a valid payment id
        When I attempt to get a payment
        Then the payment should be retrieved successfully

    Scenario: Invalid payment id
        Given I provide invalid payment id
        When I attempt to get a payment
        Then I should get an invalid payment id error
