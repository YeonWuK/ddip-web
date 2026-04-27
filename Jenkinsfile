pipeline {
    agent any

    environment {
        IMAGE_NAME = "yeonwoo02/ddip-backend"
        ES_IMAGE = "yeonwoo02/ddip-elasticsearch"
        IMAGE_TAG = "latest"
        DEPLOY_DIR = "/home/ubuntu/backend"
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

        stage('Build Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG ./backend'
                sh 'docker build -t $ES_IMAGE:$IMAGE_TAG ./backend/elasticsearch'
            }
        }

        stage('Push Image') {
            steps {
                sh 'docker push $IMAGE_NAME:$IMAGE_TAG'
                sh 'docker push $ES_IMAGE:$IMAGE_TAG'
            }
        }

        stage('Cleanup') {
            steps {
                sh 'docker rmi $IMAGE_NAME:$IMAGE_TAG || true'
                sh 'docker rmi $ES_IMAGE:$IMAGE_TAG || true'
                sh 'docker image prune -f'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                cd $DEPLOY_DIR
                docker compose pull
                docker compose up -d
                docker image prune -f
                '''
            }
        }
    }
}