pipeline {
    agent any

    environment {
        IMAGE_NAME = "seohan02/ddip-backend"
        ES_IMAGE = "seohan02/ddip-elasticsearch"
        }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-hub',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                }
            }
        }

        stage('Build & Push') {
            steps {
                sh '''
                docker build -t $IMAGE_NAME:latest ./backend
                docker build -t $ES_IMAGE:latest ./backend/elasticsearch
                docker push $IMAGE_NAME:latest
                docker push $ES_IMAGE:latest
                '''
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    string(credentialsId: 'deploy-server', variable: 'DEPLOY_SERVER')
                ]) {
                    sshagent(['ec2-ssh-key']) {
                        sh 'scp $WORKSPACE/backend/docker-compose.yml $DEPLOY_SERVER:/home/ubuntu/backend/'
                        sh 'ssh -o StrictHostKeyChecking=no $DEPLOY_SERVER "bash /home/ubuntu/deploy.sh"'
                    }
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker logout'
                sh 'docker builder prune -f'
                sh 'docker image prune -f'
            }
        }
    }

    post {
        failure {
            sh 'docker logout || true'
        }
    }
}